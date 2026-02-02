/**
 * Night Audit API
 * Create night audit records
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { NightAuditRecord } from '@/lib/pms/types';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET - Get audit history
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const limit = parseInt(searchParams.get('limit') || '30');

        const container = await getContainer();

        let query = `SELECT * FROM c WHERE c.type = 'pms_night_audit' AND c.pmsSlug = @slug`;
        const parameters: any[] = [{ name: '@slug', value: slug }];

        if (date) {
            query += ` AND c.auditDate = @date`;
            parameters.push({ name: '@date', value: date });
        }

        query += ` ORDER BY c.auditDate DESC OFFSET 0 LIMIT @limit`;
        parameters.push({ name: '@limit', value: limit });

        const { resources } = await container.items
            .query({ query, parameters })
            .fetchAll();

        return NextResponse.json({
            ok: true,
            audits: resources || [],
        });
    } catch (e: any) {
        console.error('Failed to fetch night audits:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to fetch night audits' },
            { status: 500 }
        );
    }
}

// POST - Create night audit
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'manager') {
            return NextResponse.json({ error: 'Only managers can run night audit' }, { status: 403 });
        }

        const body = await request.json();

        if (!body.auditDate) {
            return NextResponse.json({ error: 'Audit date required' }, { status: 400 });
        }

        const container = await getContainer();

        // Get PMS instance for wallet
        const { resources: instances } = await container.items
            .query({
                query: `SELECT * FROM c WHERE c.type = 'pms_instance' AND c.slug = @slug`,
                parameters: [{ name: '@slug', value: slug }],
            })
            .fetchAll();

        if (!instances || instances.length === 0) {
            return NextResponse.json({ error: 'PMS instance not found' }, { status: 404 });
        }

        // Check if already run for this date
        const { resources: existing } = await container.items
            .query({
                query: `SELECT * FROM c WHERE c.type = 'pms_night_audit' AND c.pmsSlug = @slug AND c.auditDate = @date`,
                parameters: [
                    { name: '@slug', value: slug },
                    { name: '@date', value: body.auditDate },
                ],
            })
            .fetchAll();

        if (existing && existing.length > 0) {
            return NextResponse.json({ error: 'Night audit already completed for this date' }, { status: 400 });
        }

        const now = Date.now();
        const id = `NA-${body.auditDate}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const audit: NightAuditRecord = {
            id,
            type: 'pms_night_audit',
            wallet: instances[0].wallet,
            pmsSlug: slug,
            auditDate: body.auditDate,
            occupancy: body.occupancy || 0,
            totalRooms: body.totalRooms || 0,
            occupancyPercentage: body.occupancyPercentage || 0,
            roomRevenue: body.roomRevenue || 0,
            fbRevenue: body.fbRevenue || 0,
            otherRevenue: body.otherRevenue || 0,
            totalRevenue: body.totalRevenue || 0,
            adr: body.adr || 0,
            revPar: body.revPar || 0,
            checkIns: body.checkIns || 0,
            checkOuts: body.checkOuts || 0,
            noShows: body.noShows || 0,
            cancellations: body.cancellations || 0,
            roomsOutOfOrder: body.roomsOutOfOrder || 0,
            completedBy: session.staffId,
            completedAt: now,
            notes: body.notes,
        };

        await container.items.create(audit);

        return NextResponse.json({
            ok: true,
            audit,
        });
    } catch (e: any) {
        console.error('Failed to create night audit:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to create night audit' },
            { status: 500 }
        );
    }
}
