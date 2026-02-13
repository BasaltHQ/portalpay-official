declare module 'topojson-client' {
  const value: any;
  export = value;
}

declare module 'world-atlas/countries-110m.json' {
  const value: any;
  export default value;
}

declare module '@azure/storage-blob' {
  export class BlobServiceClient {
    static fromConnectionString(connectionString: string, options?: any): BlobServiceClient;
    getContainerClient(containerName: string): ContainerClient;
  }
  export class ContainerClient {
    createIfNotExists(options?: any): Promise<any>;
    getBlockBlobClient(blobName: string): BlockBlobClient;
    listBlobsFlat(options?: any): any;
  }
  export class BlockBlobClient {
    exists(): Promise<boolean>;
    downloadToBuffer(): Promise<Buffer>;
    uploadData(data: Buffer | Uint8Array | ArrayBuffer, options?: any): Promise<any>;
    readonly url: string;
  }
}
