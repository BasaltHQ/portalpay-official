/**
 * Guest Messaging Component
 * Chat interface for communicating with guests
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import type { PMSFolio } from '@/lib/pms';

// Local interface matching the API response structure
interface ChatMessage {
    id: string;
    type: 'pms_message';
    folioId?: string;
    guestName: string;
    direction: 'inbound' | 'outbound';
    channel: string;
    subject?: string;
    content: string;
    sentBy?: string;
    sentByName?: string;
    read: boolean;
    createdAt: number;
    updatedAt: number;
}

interface GuestMessagesProps {
    pmsSlug: string;
    folio: PMSFolio;
    onClose?: () => void;
}

export function GuestMessages({ pmsSlug, folio, onClose }: GuestMessagesProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/pms/${pmsSlug}/messages?folioId=${folio.id}`);
                const data = await res.json();
                if (data.ok) {
                    setMessages(data.messages);
                    // Mark unread messages as read
                    const unread = data.messages.filter((m: ChatMessage) => m.direction === 'inbound' && !m.read);
                    for (const msg of unread) {
                        await fetch(`/api/pms/${pmsSlug}/messages`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: msg.id, read: true }),
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to fetch messages:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [pmsSlug, folio.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/pms/${pmsSlug}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folioId: folio.id,
                    content: newMessage.trim(),
                    channel: 'internal',
                }),
            });

            const data = await res.json();
            if (data.ok) {
                setMessages([data.message, ...messages]);
                setNewMessage('');
            }
        } catch (e) {
            console.error('Failed to send message:', e);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
            ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
                <div>
                    <h3 className="text-white font-medium">{folio.guestName}</h3>
                    <p className="text-xs text-gray-500">Room {folio.roomNumber} • Folio #{folio.folioNumber}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No messages yet</p>
                        <p className="text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                ) : (
                    <>
                        {[...messages].reverse().map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${message.direction === 'outbound'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-800 text-gray-200'
                                        }`}
                                >
                                    {message.subject && (
                                        <p className="text-xs font-medium opacity-75 mb-1">{message.subject}</p>
                                    )}
                                    <p className="text-sm">{message.content}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${message.direction === 'outbound' ? 'text-blue-200' : 'text-gray-500'
                                        }`}>
                                        <span>{formatTime(message.createdAt)}</span>
                                        {message.direction === 'outbound' && message.sentByName && (
                                            <span>• {message.sentByName}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/30">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium 
              hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
