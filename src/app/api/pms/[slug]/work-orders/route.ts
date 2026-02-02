/**
 * Work Orders API
 * CRUD operations for maintenance work orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { PMSWorkOrder, CreateWorkOrderInput, UpdateWorkOrderInput } from '@/lib/pms/types';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET - List all work orders
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const assignedTo = searchParams.get('assignedTo');
        const roomNumber = searchParams.get('roomNumber');

        const container = await getContainer();

        let query = `SELECT * FROM c WHERE c.type = 'pms_work_order' AND c.pmsSlug = @slug`;
        const parameters: any[] = [{ name: '@slug', value: slug }];

        if (status) {
            query += ` AND c.status = @status`;
            parameters.push({ name: '@status', value: status });
        }

        if (priority) {
            query += ` AND c.priority = @priority`;
            parameters.push({ name: '@priority', value: priority });
        }

        if (assignedTo) {
            query += ` AND c.assignedTo = @assignedTo`;
            parameters.push({ name: '@assignedTo', value: assignedTo });
        }

        if (roomNumber) {
            query += ` AND c.roomNumber = @roomNumber`;
            parameters.push({ name: '@roomNumber', value: roomNumber });
        }

        query += ` ORDER BY c.createdAt DESC`;

        const { resources } = await container.items
            .query({ query, parameters })
            .fetchAll();

        return NextResponse.json({
            ok: true,
            workOrders: resources || [],
        });
    } catch (e: any) {
        console.error('Failed to fetch work orders:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to fetch work orders' },
            { status: 500 }
        );
    }
}

// POST - Create new work order
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!['maintenance', 'manager', 'front_desk'].includes(session.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body: CreateWorkOrderInput = await request.json();

        // Validation
        if (!body.location || !body.title || !body.description || !body.category || !body.priority) {
            return NextResponse.json(
                { error: 'Missing required fields: location, title, description, category, priority' },
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
        const id = `WO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const workOrder: PMSWorkOrder = {
            id,
            type: 'pms_work_order',
            wallet: instances[0].wallet,
            pmsSlug: slug,
            roomId: body.roomId,
            roomNumber: body.roomNumber,
            location: body.location,
            category: body.category,
            title: body.title,
            description: body.description,
            priority: body.priority,
            status: body.assignedTo ? 'assigned' : 'open',
            assignedTo: body.assignedTo,
            reportedBy: session.staffId,
            reportedByName: session.username,
            estimatedCost: body.estimatedCost,
            estimatedDuration: body.estimatedDuration,
            partsNeeded: body.partsNeeded,
            notes: body.notes,
            createdAt: now,
            updatedAt: now,
        };

        await container.items.create(workOrder);

        return NextResponse.json({
            ok: true,
            workOrder,
        });
    } catch (e: any) {
        console.error('Failed to create work order:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to create work order' },
            { status: 500 }
        );
    }
}

// PATCH - Update work order
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates }: { id: string } & UpdateWorkOrderInput = body;

        if (!id) {
            return NextResponse.json({ error: 'Work order ID required' }, { status: 400 });
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

        // Fetch existing work order
        const { resource: existing } = await container.item(id, wallet).read();

        if (!existing) {
            return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
        }

        // Handle status changes
        const now = Date.now();
        let additionalUpdates: Partial<PMSWorkOrder> = {};

        if (updates.status === 'in_progress' && existing.status !== 'in_progress') {
            additionalUpdates.startedAt = now;
        }

        if (updates.status === 'completed' && existing.status !== 'completed') {
            additionalUpdates.completedAt = now;
        }

        // Update
        const updated = {
            ...existing,
            ...updates,
            ...additionalUpdates,
            updatedAt: now,
        };

        await container.item(id, wallet).replace(updated);

        return NextResponse.json({
            ok: true,
            workOrder: updated,
        });
    } catch (e: any) {
        console.error('Failed to update work order:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to update work order' },
            { status: 500 }
        );
    }
}

// DELETE - Delete work order
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only managers can delete
        if (session.role !== 'manager') {
            return NextResponse.json({ error: 'Only managers can delete work orders' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Work order ID required' }, { status: 400 });
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
        console.error('Failed to delete work order:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to delete work order' },
            { status: 500 }
        );
    }
}
