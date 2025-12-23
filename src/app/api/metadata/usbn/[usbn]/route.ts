import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

/**
 * Public Metadata API for Books (USBN Lookup)
 * Returns JSON metadata for a given USBN.
 * URL: /api/metadata/usbn/[usbn]
 */
export async function GET(req: NextRequest, props: { params: Promise<{ usbn: string }> }) {
    try {
        const params = await props.params;
        const usbn = params.usbn;
        if (!usbn) return NextResponse.json({ error: "Missing USBN" }, { status: 400 });

        const container = await getContainer();

        // Query for item by USBN (Cross-partition)
        // USBN is unique enough
        const querySpec = {
            query: "SELECT * FROM c WHERE c.contentDetails.usbn = @usbn AND c.isBook = true",
            parameters: [{ name: "@usbn", value: usbn }]
        };

        const { resources } = await container.items.query(querySpec).fetchAll();
        const item = resources[0];

        if (!item) {
            return NextResponse.json({ error: "Book not found for USBN: " + usbn }, { status: 404 });
        }

        // Determine Author Name
        let author = item.attributes?.author || item.contentDetails?.author;
        if (!author && item.contentDetails?.authorFirstName) {
            author = `${item.contentDetails.authorFirstName} ${item.contentDetails.authorLastName}`;
        }

        // Construct Metadata Response
        const metadata = {
            name: item.name,
            description: item.description,
            image: item.bookCoverUrl || item.images?.[0],
            external_url: `https://payportal.app/library/${item.id}`,
            attributes: [
                { trait_type: "Author", value: author },
                { trait_type: "Publisher", value: item.attributes?.publisher || item.contentDetails?.publisher },
                { trait_type: "Language", value: item.attributes?.language || item.contentDetails?.language },
                { trait_type: "USBN", value: item.contentDetails?.usbn },
                { trait_type: "Pages", value: item.attributes?.pageCount || item.contentDetails?.pages },
                { trait_type: "Genre", value: item.attributes?.genre || item.contentDetails?.categories?.[0] }
            ],
            properties: {
                generated_at: new Date().toISOString(),
                usbn: item.contentDetails?.usbn,
                sku: item.sku
            }
        };

        return NextResponse.json(metadata);

    } catch (e: any) {
        console.error("Metadata API Error:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
