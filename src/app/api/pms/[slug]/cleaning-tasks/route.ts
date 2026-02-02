/**
 * Cleaning Tasks API
 * CRUD operations for housekeeping cleaning tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { PMSCleaningTask, CreateCleaningTaskInput, CleaningStatus } from '@/lib/pms/types';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET - List all cleaning tasks
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
        const date = searchParams.get('date'); // YYYY-MM-DD

        const container = await getContainer();

        let query = `SELECT * FROM c WHERE c.type = 'pms_cleaning_task' AND c.pmsSlug = @slug`;
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

        // Filter by date (today by default)
        if (date) {
            const startOfDay = new Date(date).setHours(0, 0, 0, 0);
            const endOfDay = new Date(date).setHours(23, 59, 59, 999);
            query += ` AND c.createdAt >= @startOfDay AND c.createdAt <= @endOfDay`;
            parameters.push({ name: '@startOfDay', value: startOfDay });
            parameters.push({ name: '@endOfDay', value: endOfDay });
        }

        query += ` ORDER BY c.priority DESC, c.createdAt ASC`;

        const { resources } = await container.items
            .query({ query, parameters })
            .fetchAll();

        return NextResponse.json({
            ok: true,
            tasks: resources || [],
        });
    } catch (e: any) {
        console.error('Failed to fetch cleaning tasks:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to fetch cleaning tasks' },
            { status: 500 }
        );
    }
}

// POST - Create new cleaning task
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check permissions
        if (!['housekeeping', 'manager', 'front_desk'].includes(session.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body: CreateCleaningTaskInput = await request.json();

        // Validation
        if (!body.roomId || !body.roomNumber || !body.priority) {
            return NextResponse.json(
                { error: 'Missing required fields: roomId, roomNumber, priority' },
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
        const id = `CT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Get staff name if assigned
        let assignedToName: string | undefined;
        if (body.assignedTo) {
            const { resources: staffUsers } = await container.items
                .query({
                    query: `SELECT * FROM c WHERE c.id = @id AND c.type = 'pms_staff'`,
                    parameters: [{ name: '@id', value: body.assignedTo }],
                })
                .fetchAll();
            if (staffUsers && staffUsers.length > 0) {
                assignedToName = staffUsers[0].displayName;
            }
        }

        const task: PMSCleaningTask = {
            id,
            type: 'pms_cleaning_task',
            wallet: instances[0].wallet,
            pmsSlug: slug,
            roomId: body.roomId,
            roomNumber: body.roomNumber,
            priority: body.priority,
            status: 'pending',
            assignedTo: body.assignedTo,
            assignedToName,
            notes: body.notes,
            specialInstructions: body.specialInstructions,
            guestCheckoutTime: body.guestCheckoutTime,
            expectedArrivalTime: body.expectedArrivalTime,
            createdAt: now,
            updatedAt: now,
        };

        await container.items.create(task);

        return NextResponse.json({
            ok: true,
            task,
        });
    } catch (e: any) {
        console.error('Failed to create cleaning task:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to create cleaning task' },
            { status: 500 }
        );
    }
}

// PATCH - Update cleaning task
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status, ...updates }: { id: string; status?: CleaningStatus } & Partial<PMSCleaningTask> = body;

        if (!id) {
            return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
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

        // Fetch existing task
        const { resource: existing } = await container.item(id, wallet).read();

        if (!existing) {
            return NextResponse.json({ error: 'Cleaning task not found' }, { status: 404 });
        }

        // Handle status changes
        const now = Date.now();
        let additionalUpdates: Partial<PMSCleaningTask> = {};

        if (status && status !== existing.status) {
            if (status === 'in_progress') {
                additionalUpdates.startedAt = now;
            } else if (status === 'completed') {
                additionalUpdates.completedAt = now;
                // Calculate duration if started
                if (existing.startedAt) {
                    additionalUpdates.duration = Math.round((now - existing.startedAt) / 60000);
                }
            } else if (status === 'inspected') {
                additionalUpdates.inspectedBy = session.staffId;
                additionalUpdates.inspectedAt = now;
            }
        }

        // Update
        const updated = {
            ...existing,
            ...updates,
            status: status || existing.status,
            ...additionalUpdates,
            updatedAt: now,
        };

        await container.item(id, wallet).replace(updated);

        return NextResponse.json({
            ok: true,
            task: updated,
        });
    } catch (e: any) {
        console.error('Failed to update cleaning task:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to update cleaning task' },
            { status: 500 }
        );
    }
}

// POST - Generate daily cleaning tasks from checkouts/stayovers
export async function generateDailyTasks(slug: string, wallet: string) {
    const container = await getContainer();
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // Get today's expected checkouts from folios
    const { resources: checkoutFolios } = await container.items
        .query({
            query: `
        SELECT * FROM c 
        WHERE c.type = 'pms_folio' 
        AND c.pmsSlug = @slug
        AND c.status = 'open'
      `,
            parameters: [{ name: '@slug', value: slug }],
        })
        .fetchAll();

    const tasks: PMSCleaningTask[] = [];

    // Create checkout cleaning tasks
    for (const folio of checkoutFolios || []) {
        const checkoutDate = new Date(folio.checkOut).toISOString().split('T')[0];
        if (checkoutDate === today) {
            tasks.push({
                id: `CT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                type: 'pms_cleaning_task',
                wallet,
                pmsSlug: slug,
                roomId: folio.roomId,
                roomNumber: folio.roomNumber,
                priority: 'checkout',
                status: 'pending',
                guestCheckoutTime: folio.checkOut,
                createdAt: now,
                updatedAt: now,
            });
        }
    }

    // Create tasks in batch
    for (const task of tasks) {
        await container.items.create(task);
    }

    return tasks;
}
