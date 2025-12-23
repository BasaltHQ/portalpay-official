import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

/**
 * Public Metadata API for Books (USBN)
 * Returns JSON metadata for a given Book ID. 
 * Used by on-chain USBN contracts to display book details.
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = decodeURIComponent(params.id);
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const container = await getContainer();

        // Query for item with ID (Cross-partition query since simple lookup)
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id AND c.isBook = true",
            parameters: [{ name: "@id", value: id }]
        };

        const { resources } = await container.items.query(querySpec).fetchAll();
        const item = resources[0];

        if (!item) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // Determine Author Name
        let author = item.attributes?.author || item.contentDetails?.author;
        if (!author && item.contentDetails?.authorFirstName) {
            author = `${item.contentDetails.authorFirstName} ${item.contentDetails.authorLastName}`;
        }

        // Construct Metadata Response
        // Follows generic NFT metadata standards (OpenSea-like)
        const metadata = {
            name: item.name,
            description: item.description,
            image: item.bookCoverUrl || item.images?.[0],
            external_url: `https://payportal.app/shop/item/${item.id}`,
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
