import { NextRequest, NextResponse } from 'next/server';

// --- In-Memory Storage (Replace with DB) ---
// Structure: Record<wallet_or_platform, Role[]>
let ROLES_DB: Record<string, any[]> = {};

// Default Roles
const DEFAULT_ROLES = [
    { id: 'bronze', name: 'Bronze Member', minLevel: 1, color: '#CD7F32', icon: 'shield' },
    { id: 'silver', name: 'Silver Member', minLevel: 10, color: '#C0C0C0', icon: 'star' },
    { id: 'gold', name: 'Gold Member', minLevel: 25, color: '#FFD700', icon: 'crown' },
    { id: 'platinum', name: 'Platinum Member', minLevel: 40, color: '#E5E4E2', icon: 'trophy' },
    { id: 'diamond', name: 'Diamond Member', minLevel: 50, color: '#B9F2FF', icon: 'gem' },
];

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'platform' or 'merchant'
    const wallet = searchParams.get('wallet');

    let key = '';
    if (type === 'platform') {
        key = 'platform';
    } else if (type === 'merchant' && wallet) {
        key = `merchant_${wallet}`;
    } else {
        return NextResponse.json({ error: 'Invalid type or missing wallet' }, { status: 400 });
    }

    // Return stored roles or defaults
    const roles = ROLES_DB[key] || DEFAULT_ROLES;

    return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, wallet, roles } = body;

        if (!roles || !Array.isArray(roles)) {
            return NextResponse.json({ error: 'Invalid roles data' }, { status: 400 });
        }

        let key = '';
        if (type === 'platform') {
            key = 'platform';
        } else if (type === 'merchant' && wallet) {
            key = `merchant_${wallet}`;
        } else {
            return NextResponse.json({ error: 'Invalid type or missing wallet' }, { status: 400 });
        }

        ROLES_DB[key] = roles;

        return NextResponse.json({ success: true, roles });
    } catch (e) {
        console.error("Failed to save roles", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
