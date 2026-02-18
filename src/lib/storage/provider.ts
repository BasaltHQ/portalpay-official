
export interface StorageProvider {
    /**
     * Upload a file to storage
     * @param path The remote path (container/filename or bucket/key)
     * @param data The file content (Buffer, string, or Stream)
     * @param contentType The MIME type of the file
     */
    upload(path: string, data: Buffer | string | Blob | ArrayBuffer, contentType: string): Promise<string>;

    /**
     * Get a public URL for the file
     * @param path The remote path
     */
    getUrl(path: string): Promise<string>;

    /**
     * Delete a file from storage
     * @param path The remote path
     */
    delete(path: string): Promise<void>;

    /**
     * Check if a file exists
     * @param path The remote path
     */
    exists(path: string): Promise<boolean>;

    /**
     * Download a file as a Buffer
     * @param path The remote path
     */
    download(path: string): Promise<Buffer>;

    /**
     * List files
     * @param pathPrefix The prefix to search for
     */
    list(pathPrefix?: string): Promise<string[]>;

    /**
     * Get a temporary signed URL for read access (SAS / Presigned URL)
     * @param path The remote path
     * @param expiresInSeconds Duration in seconds (default 3600)
     */
    getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;
}
