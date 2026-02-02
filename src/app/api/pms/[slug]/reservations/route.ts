/**
 * Reservations API
 * CRUD operations for guest reservations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { PMSReservation } from '@/lib/pms/types';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET - List reservations with optional filters
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const roomNumber = searchParams.get('roomNumber');
        const guestName = searchParams.get('guestName');

        const container = await getContainer();

        let query = `SELECT * FROM c WHERE c.type = 'pms_reservation' AND c.pmsSlug = @slug`;
        const parameters: any[] = [{ name: '@slug', value: slug }];

        if (status) {
            query += ` AND c.status = @status`;
            parameters.push({ name: '@status', value: status });
        }

        if (startDate) {
            query += ` AND c.checkOutDate >= @startDate`;
            parameters.push({ name: '@startDate', value: startDate });
        }

        if (endDate) {
            query += ` AND c.checkInDate <= @endDate`;
            parameters.push({ name: '@endDate', value: endDate });
        }

        if (roomNumber) {
            query += ` AND c.roomNumber = @roomNumber`;
            parameters.push({ name: '@roomNumber', value: roomNumber });
        }

        if (guestName) {
            query += ` AND CONTAINS(LOWER(c.guestName), LOWER(@guestName))`;
            parameters.push({ name: '@guestName', value: guestName });
        }

        query += ` ORDER BY c.checkInDate ASC`;

        const { resources } = await container.items
            .query({ query, parameters })
            .fetchAll();

        return NextResponse.json({
            ok: true,
            reservations: resources || [],
        });
    } catch (e: any) {
        console.error('Failed to fetch reservations:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to fetch reservations' },
            { status: 500 }
        );
    }
}

// POST - Create new reservation
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
        const required = ['guestName', 'checkInDate', 'checkOutDate', 'roomId', 'roomNumber'];
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

        // Check for overlapping reservations
        const { resources: overlapping } = await container.items
            .query({
                query: `
          SELECT * FROM c 
          WHERE c.type = 'pms_reservation' 
          AND c.pmsSlug = @slug
          AND c.roomNumber = @roomNumber
          AND c.status NOT IN ('cancelled', 'checked_out', 'no_show')
          AND c.checkInDate < @checkOut
          AND c.checkOutDate > @checkIn
        `,
                parameters: [
                    { name: '@slug', value: slug },
                    { name: '@roomNumber', value: body.roomNumber },
                    { name: '@checkIn', value: body.checkInDate },
                    { name: '@checkOut', value: body.checkOutDate },
                ],
            })
            .fetchAll();

        if (overlapping && overlapping.length > 0) {
            return NextResponse.json(
                { error: 'Room is not available for selected dates', conflicts: overlapping },
                { status: 409 }
            );
        }

        const now = Date.now();
        const confirmationNumber = `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const reservation: PMSReservation = {
            id: confirmationNumber,
            type: 'pms_reservation',
            wallet: instances[0].wallet,
            pmsSlug: slug,
            confirmationNumber,
            guestName: body.guestName,
            guestEmail: body.guestEmail,
            guestPhone: body.guestPhone,
            roomId: body.roomId,
            roomNumber: body.roomNumber,
            roomType: body.roomType,
            checkInDate: body.checkInDate,
            checkOutDate: body.checkOutDate,
            numGuests: body.numGuests || { adults: 1, children: 0 },
            ratePerNight: body.ratePerNight || 0,
            totalAmount: body.totalAmount || 0,
            depositAmount: body.depositAmount || 0,
            balanceDue: (body.totalAmount || 0) - (body.depositAmount || 0),
            status: 'pending',
            paymentStatus: body.depositAmount > 0 ? 'partial' : 'pending',
            source: body.source || 'direct',
            specialRequests: body.specialRequests,
            internalNotes: body.internalNotes,
            createdBy: session.staffId,
            createdAt: now,
            updatedAt: now,
        };

        await container.items.create(reservation);

        return NextResponse.json({
            ok: true,
            reservation,
        });
    } catch (e: any) {
        console.error('Failed to create reservation:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to create reservation' },
            { status: 500 }
        );
    }
}

// PATCH - Update reservation (status, details, etc.)
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
            return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 });
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

        // Fetch existing reservation
        const { resource: existing } = await container.item(id, wallet).read();

        if (!existing) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // Handle status transitions
        if (updates.status) {
            const validTransitions: Record<string, string[]> = {
                pending: ['confirmed', 'cancelled'],
                confirmed: ['checked_in', 'cancelled', 'no_show'],
                checked_in: ['checked_out'],
                checked_out: [],
                cancelled: [],
                no_show: [],
            };

            if (!validTransitions[existing.status]?.includes(updates.status)) {
                return NextResponse.json(
                    { error: `Cannot transition from ${existing.status} to ${updates.status}` },
                    { status: 400 }
                );
            }

            // Set timestamps for status changes
            if (updates.status === 'checked_in') {
                updates.actualCheckIn = Date.now();
            } else if (updates.status === 'checked_out') {
                updates.actualCheckOut = Date.now();
            }
        }

        const updated = {
            ...existing,
            ...updates,
            updatedAt: Date.now(),
        };

        // Recalculate balance if payment amounts changed
        if (updates.totalAmount !== undefined || updates.depositAmount !== undefined) {
            updated.balanceDue = (updated.totalAmount || 0) - (updated.depositAmount || 0);
        }

        await container.item(id, wallet).replace(updated);

        return NextResponse.json({
            ok: true,
            reservation: updated,
        });
    } catch (e: any) {
        console.error('Failed to update reservation:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to update reservation' },
            { status: 500 }
        );
    }
}

// DELETE - Cancel reservation (manager only)
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'manager') {
            return NextResponse.json({ error: 'Only managers can delete reservations' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Reservation ID required' }, { status: 400 });
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
        console.error('Failed to delete reservation:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to delete reservation' },
            { status: 500 }
        );
    }
}
