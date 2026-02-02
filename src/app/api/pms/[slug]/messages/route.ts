/**
 * Guest Messaging API
 * Internal messaging system for guest communication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContainer } from '@/lib/cosmos';
import { getStaffSession } from '@/lib/pms/auth';
import type { PMSMessage } from '@/lib/pms/types';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET - Fetch messages for a folio or all recent messages
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const folioId = searchParams.get('folioId');
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        const container = await getContainer();

        let query = `SELECT * FROM c WHERE c.type = 'pms_message' AND c.pmsSlug = @slug`;
        const parameters: any[] = [{ name: '@slug', value: slug }];

        if (folioId) {
            query += ` AND c.folioId = @folioId`;
            parameters.push({ name: '@folioId', value: folioId });
        }

        if (unreadOnly) {
            query += ` AND c.read = false AND c.direction = 'inbound'`;
        }

        query += ` ORDER BY c.createdAt DESC OFFSET 0 LIMIT @limit`;
        parameters.push({ name: '@limit', value: limit });

        const { resources } = await container.items
            .query({ query, parameters })
            .fetchAll();

        return NextResponse.json({
            ok: true,
            messages: resources || [],
        });
    } catch (e: any) {
        console.error('Failed to fetch messages:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// POST - Create a new message
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { slug } = await context.params;
        const session = await getStaffSession();

        if (!session || session.pmsSlug !== slug) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.folioId || !body.content) {
            return NextResponse.json({ error: 'folioId and content are required' }, { status: 400 });
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

        // Verify folio exists
        const { resources: folios } = await container.items
            .query({
                query: `SELECT * FROM c WHERE c.type = 'pms_folio' AND c.id = @folioId AND c.pmsSlug = @slug`,
                parameters: [
                    { name: '@folioId', value: body.folioId },
                    { name: '@slug', value: slug },
                ],
            })
            .fetchAll();

        if (!folios || folios.length === 0) {
            return NextResponse.json({ error: 'Folio not found' }, { status: 404 });
        }

        const now = Date.now();

        const message: PMSMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            type: 'pms_message',
            wallet: instances[0].wallet,
            pmsSlug: slug,
            folioId: body.folioId,
            guestName: folios[0].guestName,
            direction: 'outbound', // Staff sending to guest
            channel: body.channel || 'internal',
            subject: body.subject,
            content: body.content,
            sentBy: session.staffId,
            sentByName: session.name || session.username,
            read: false,
            createdAt: now,
            updatedAt: now,
        };

        await container.items.create(message);

        return NextResponse.json({
            ok: true,
            message,
        });
    } catch (e: any) {
        console.error('Failed to create message:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to create message' },
            { status: 500 }
        );
    }
}

// PATCH - Mark message as read or update
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
            return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
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

        // Fetch existing message
        const { resource: existing } = await container.item(id, wallet).read();

        if (!existing) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        const updated = {
            ...existing,
            ...updates,
            readAt: updates.read ? Date.now() : existing.readAt,
            updatedAt: Date.now(),
        };

        await container.item(id, wallet).replace(updated);

        return NextResponse.json({
            ok: true,
            message: updated,
        });
    } catch (e: any) {
        console.error('Failed to update message:', e);
        return NextResponse.json(
            { error: e?.message || 'Failed to update message' },
            { status: 500 }
        );
    }
}
