'use server';

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import path from 'path';
import { pathToFileURL } from 'url';

// Configure worker for Node.js environment
if (typeof window === 'undefined') {
    // Point to the local worker file in node_modules
    // usage of pathToFileURL is required for Windows compatibility with ESM loaders
    const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();
}

/**
 * Fetches a PDF from a URL and returns the number of pages.
 * Runs entirely on the server to avoid client-side worker issues.
 */
export async function getPdfPageCount(url: string): Promise<number> {
    if (!url) return 0;

    try {
        console.log(`[Server] Fetching PDF page count for: ${url}`);

        const res = await fetch(url);
        if (!res.ok) {
            console.error(`[Server] Failed to fetch PDF: ${res.status} ${res.statusText}`);
            return 0;
        }

        const arrayBuffer = await res.arrayBuffer();

        // Load into PDF.js
        const loadingTask = pdfjs.getDocument({
            data: arrayBuffer,
            isEvalSupported: false,
            useSystemFonts: true,
            disableFontFace: true, // Disable remote font fetching
        });

        const doc = await loadingTask.promise;

        console.log(`[Server] PDF loaded. Pages: ${doc.numPages}`);
        return doc.numPages;
    } catch (error) {
        console.error("[Server] Error counting PDF pages:", error);
        return 0;
    }
}
