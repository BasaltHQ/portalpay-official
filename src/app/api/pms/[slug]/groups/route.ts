/**
 * Group Bookings API
 * CRUD operations for group and corporate reservations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { GroupBooking } from '@/lib/pms/types';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET - List group bookings with optional filters
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const searchName = searchParams.get('name');

        const container = await getContainer();

        let query = `SELECT * FROM c WHERE c.type = 'pms_group_booking' AND c.pmsSlug = @slug`;
        const parameters: any[] = [{ name: '@slug', value: slug }];

        if (status) {
            query += ` AND c.status = @status`;
            parameters.push({ name: '@status', value: status });
        }

        if (searchName) {
            query += ` AND CONTAINS(LOWER(c.groupName), LOWER(@searchName))`;
            parameters.push({ name: '@searchName', value: searchName });
        }

        query += ` ORDER BY c.checkInDate ASC`;

        const { resources } = await container.items
            .query({ query, parameters })
            .fetchAll();

        return NextResponse.json({
            ok: true,
            groups: resources || [],
        });
    } catch (e: any) {
        console.error('Failed to fetch group bookings:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to fetch group bookings' },
            { status: 500 }
        );
    }
}

// POST - Create new group booking
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!['front_desk', 'manager'].includes(session.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();

        // Validate required fields
        const required = ['groupName', 'contactName', 'checkInDate', 'checkOutDate', 'roomsRequested'];
        for (const field of required) {
            if (!body[field]) {
                return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
            }
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
        const groupCode = `GRP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        const groupBooking = {
            id: groupCode,
            type: 'pms_group' as const,
            wallet: instances[0].wallet,
            pmsSlug: slug,
            name: body.groupName,
            contactName: body.contactName,
            contactEmail: body.contactEmail,
            contactPhone: body.contactPhone,
            companyName: body.companyName,
            reservationIds: [] as string[],
            billingType: body.billingType || 'individual',
            negotiatedRate: body.negotiatedRate,
            totalRooms: body.roomsRequested,
            checkInDate: body.checkInDate,
            checkOutDate: body.checkOutDate,
            depositAmount: body.depositAmount || 0,
            depositPaid: false,
            specialRequests: body.specialRequests,
            cateringRequirements: body.cateringRequirements,
            meetingRooms: body.meetingRooms,
            status: 'inquiry',
            createdBy: session.staffId,
            createdAt: now,
            updatedAt: now,
        };

        await container.items.create(groupBooking);

        return NextResponse.json({
            ok: true,
            group: groupBooking,
        });
    } catch (e: any) {
        console.error('Failed to create group booking:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to create group booking' },
            { status: 500 }
        );
    }
}

// PATCH - Update group booking
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Group booking ID required' }, { status: 400 });
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

        // Fetch existing group booking
        const { resource: existing } = await container.item(id, wallet).read();

        if (!existing) {
            return NextResponse.json({ error: 'Group booking not found' }, { status: 404 });
        }

        // Handle status transitions
        if (updates.status) {
            const validTransitions: Record<string, string[]> = {
                inquiry: ['tentative', 'cancelled'],
                tentative: ['confirmed', 'cancelled'],
                confirmed: ['definite', 'cancelled'],
                definite: ['completed', 'cancelled'],
                completed: [],
                cancelled: [],
            };

            if (!validTransitions[existing.status]?.includes(updates.status)) {
                return NextResponse.json(
                    { error: `Cannot transition from ${existing.status} to ${updates.status}` },
                    { status: 400 }
                );
            }
        }

        const updated = {
            ...existing,
            ...updates,
            updatedAt: Date.now(),
        };

        await container.item(id, wallet).replace(updated);

        return NextResponse.json({
            ok: true,
            group: updated,
        });
    } catch (e: any) {
        console.error('Failed to update group booking:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to update group booking' },
            { status: 500 }
        );
    }
}

// DELETE - Delete group booking (manager only)
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'manager') {
            return NextResponse.json({ error: 'Only managers can delete group bookings' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Group booking ID required' }, { status: 400 });
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
        console.error('Failed to delete group booking:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to delete group booking' },
            { status: 500 }
        );
    }
}
