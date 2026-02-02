/**
 * Rates API
 * CRUD operations for rate plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { RatePlan } from '@/lib/pms/types';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET - List all rate plans
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const container = await getContainer();

        const { resources } = await container.items
            .query({
                query: `SELECT * FROM c WHERE c.type = 'pms_rate_plan' AND c.pmsSlug = @slug ORDER BY c.roomTypeName ASC`,
                parameters: [{ name: '@slug', value: slug }],
            })
            .fetchAll();

        return NextResponse.json({
            ok: true,
            ratePlans: resources || [],
        });
    } catch (e: any) {
        console.error('Failed to fetch rate plans:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to fetch rate plans' },
            { status: 500 }
        );
    }
}

// POST - Create new rate plan
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'manager') {
            return NextResponse.json({ error: 'Only managers can manage rates' }, { status: 403 });
        }

        const body = await request.json();

        if (!body.name || !body.roomTypeId || !body.baseRate) {
            return NextResponse.json(
                { error: 'Missing required fields: name, roomTypeId, baseRate' },
                { status: 400 }
            );
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

        const now = Date.now();
        const id = `RP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const ratePlan: RatePlan = {
            id,
            type: 'pms_rate_plan',
            wallet: instances[0].wallet,
            pmsSlug: slug,
            name: body.name,
            description: body.description,
            roomTypeId: body.roomTypeId,
            roomTypeName: body.roomTypeName || body.roomTypeId,
            baseRate: body.baseRate,
            currency: body.currency || 'USD',
            seasonalAdjustments: body.seasonalAdjustments || [],
            dayOfWeekModifiers: body.dayOfWeekModifiers || {},
            minStay: body.minStay || 1,
            maxStay: body.maxStay,
            includesBreakfast: body.includesBreakfast || false,
            cancellationPolicy: body.cancellationPolicy || 'moderate',
            isActive: body.isActive !== false,
            createdAt: now,
            updatedAt: now,
        };

        await container.items.create(ratePlan);

        return NextResponse.json({
            ok: true,
            ratePlan,
        });
    } catch (e: any) {
        console.error('Failed to create rate plan:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to create rate plan' },
            { status: 500 }
        );
    }
}

// PATCH - Update rate plan
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'manager') {
            return NextResponse.json({ error: 'Only managers can manage rates' }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Rate plan ID required' }, { status: 400 });
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

        const wallet = instances[0].wallet;

        // Fetch existing
        const { resource: existing } = await container.item(id, wallet).read();

        if (!existing) {
            return NextResponse.json({ error: 'Rate plan not found' }, { status: 404 });
        }

        const updated = {
            ...existing,
            ...updates,
            updatedAt: Date.now(),
        };

        await container.item(id, wallet).replace(updated);

        return NextResponse.json({
            ok: true,
            ratePlan: updated,
        });
    } catch (e: any) {
        console.error('Failed to update rate plan:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to update rate plan' },
            { status: 500 }
        );
    }
}

// DELETE - Delete rate plan  
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'manager') {
            return NextResponse.json({ error: 'Only managers can manage rates' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Rate plan ID required' }, { status: 400 });
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

        await container.item(id, instances[0].wallet).delete();

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error('Failed to delete rate plan:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to delete rate plan' },
            { status: 500 }
        );
    }
}
