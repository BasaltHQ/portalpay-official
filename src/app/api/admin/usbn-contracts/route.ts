import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * API for managing deployed USBN contracts per chain.
 * Stores data in a JSON file for simplicity.
 * 
 * GET - Returns all deployed contracts
 * POST - Saves a new deployment { chainId, address, deployedAt, verified }
 * PATCH - Updates verification status { chainId, address, verified }
 */

interface USBNContract {
    chainId: number;
    chainName: string;
    address: string;
    deployedAt: string;
    verified: boolean;
    txHash?: string;
}

const DATA_FILE = path.resolve(process.cwd(), "data", "usbn-contracts.json");

function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function loadContracts(): USBNContract[] {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function saveContracts(contracts: USBNContract[]) {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(contracts, null, 2));
}

export async function GET() {
    try {
        const contracts = loadContracts();
        return NextResponse.json({ ok: true, contracts });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chainId, chainName, address, txHash } = body;

        if (!chainId || !address) {
            return NextResponse.json({ ok: false, error: "Missing chainId or address" }, { status: 400 });
        }

        const contracts = loadContracts();

        // Check if already exists for this chain
        const existing = contracts.find(c => c.chainId === chainId && c.address.toLowerCase() === address.toLowerCase());
        if (existing) {
            return NextResponse.json({ ok: true, message: "Contract already saved", contract: existing });
        }

        const newContract: USBNContract = {
            chainId,
            chainName: chainName || `Chain ${chainId}`,
            address,
            deployedAt: new Date().toISOString(),
            verified: false,
            txHash,
        };

        contracts.push(newContract);
        saveContracts(contracts);

        return NextResponse.json({ ok: true, contract: newContract });

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { chainId, address, verified } = body;

        if (!chainId || !address) {
            return NextResponse.json({ ok: false, error: "Missing chainId or address" }, { status: 400 });
        }

        const contracts = loadContracts();
        const idx = contracts.findIndex(c => c.chainId === chainId && c.address.toLowerCase() === address.toLowerCase());

        if (idx === -1) {
            return NextResponse.json({ ok: false, error: "Contract not found" }, { status: 404 });
        }

        contracts[idx].verified = verified;
        saveContracts(contracts);

        return NextResponse.json({ ok: true, contract: contracts[idx] });

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
