import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const s = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 40, paddingBottom: 60, fontFamily: 'Helvetica', color: '#111827', fontSize: 9 },
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 2 },
    brandName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    meta: { fontSize: 8, color: '#6B7280', marginBottom: 2 },
    reportTitle: { fontSize: 13, fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    // Summary
    summaryRow: { flexDirection: 'row', marginBottom: 16 },
    card: { flexGrow: 1, backgroundColor: '#F9FAFB', padding: 10, marginRight: 6, borderTopWidth: 2, borderWidth: 1, borderColor: '#E5E7EB' },
    cardLast: { marginRight: 0 },
    cardLabel: { fontSize: 7, color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 3 },
    cardValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    // Section
    section: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
    // Table
    table: { width: '100%', marginBottom: 12 },
    tHead: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingVertical: 6, paddingHorizontal: 6 },
    tRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 5, paddingHorizontal: 6, alignItems: 'center' },
    tRowAlt: { backgroundColor: '#FAFAFA' },
    tRowCash: { backgroundColor: '#FFF7ED' },
    tRowTotal: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderTopWidth: 2, borderTopColor: '#374151', paddingVertical: 6, paddingHorizontal: 6, alignItems: 'center' },
    // Columns — widths: # 4%, Date 12%, Type 16%, Method 10%, Token Amt 16%, USD 12%, Reference 30%
    cNum: { width: '4%', fontSize: 7, color: '#9CA3AF', paddingRight: 2 },
    cDate: { width: '12%', fontSize: 8, paddingRight: 4 },
    cType: { width: '16%', fontSize: 8, paddingRight: 4 },
    cMethod: { width: '10%', fontSize: 8, paddingRight: 4 },
    cTokenAmt: { width: '16%', fontSize: 8, textAlign: 'right', paddingRight: 6, fontFamily: 'Courier', color: '#6B7280' },
    cUsd: { width: '12%', fontSize: 8, textAlign: 'right', paddingRight: 6, fontFamily: 'Helvetica-Bold' },
    cRef: { width: '30%', fontSize: 7, color: '#6B7280', fontFamily: 'Courier' },
    // Header cols
    hNum: { width: '4%', fontSize: 7, fontWeight: 'bold', color: '#4B5563', paddingRight: 2 },
    hDate: { width: '12%', fontSize: 7, fontWeight: 'bold', color: '#4B5563', paddingRight: 4 },
    hType: { width: '16%', fontSize: 7, fontWeight: 'bold', color: '#4B5563', paddingRight: 4 },
    hMethod: { width: '10%', fontSize: 7, fontWeight: 'bold', color: '#4B5563', paddingRight: 4 },
    hTokenAmt: { width: '16%', fontSize: 7, fontWeight: 'bold', color: '#4B5563', textAlign: 'right', paddingRight: 6 },
    hUsd: { width: '12%', fontSize: 7, fontWeight: 'bold', color: '#4B5563', textAlign: 'right', paddingRight: 6 },
    hRef: { width: '30%', fontSize: 7, fontWeight: 'bold', color: '#4B5563' },
    // Badges
    badge: { fontSize: 6, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2 },
    badgeCash: { backgroundColor: '#FED7AA', color: '#9A3412' },
    badgePayment: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    badgeMerchantRelease: { backgroundColor: '#D1FAE5', color: '#065F46' },
    badgePartnerRelease: { backgroundColor: '#EDE9FE', color: '#5B21B6' },
    badgePlatformRelease: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    badgeAgentRelease: { backgroundColor: '#CFFAFE', color: '#155E75' },
    badgeReceipt: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    // Footer
    footer: { position: 'absolute', bottom: 25, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 7, color: '#9CA3AF' },
});

type TxCategory = 'cash' | 'receipt' | 'payment' | 'merchant_release' | 'partner_release' | 'platform_release' | 'agent_release';

interface LedgerEntry {
    date: string;
    category: TxCategory;
    label: string;
    method: string;
    tokenAmount: string;
    amountUsd: number;
    reference: string;
    sortKey: number;
}

interface LedgerPDFProps {
    brandName: string;
    brandColor?: string;
    date: string;
    dateRange: string;
    generatedBy: string;
    receipts: { id: string; totalUsd: number; currency?: string; paymentMethod?: string; createdAt?: number }[];
    splitTransactions: { hash: string; token: string; value: number; valueUsd?: number; timestamp?: number; txType?: string; releaseType?: string }[];
}

function getBadgeStyle(cat: TxCategory) {
    switch (cat) {
        case 'cash': return s.badgeCash;
        case 'receipt': return s.badgeReceipt;
        case 'payment': return s.badgePayment;
        case 'merchant_release': return s.badgeMerchantRelease;
        case 'partner_release': return s.badgePartnerRelease;
        case 'platform_release': return s.badgePlatformRelease;
        case 'agent_release': return s.badgeAgentRelease;
        default: return s.badgeReceipt;
    }
}

function getBadgeLabel(cat: TxCategory): string {
    switch (cat) {
        case 'cash': return 'CASH';
        case 'receipt': return 'RECEIPT';
        case 'payment': return 'PAYMENT';
        case 'merchant_release': return 'MERCHANT REL.';
        case 'partner_release': return 'PARTNER REL.';
        case 'platform_release': return 'PLATFORM REL.';
        case 'agent_release': return 'AGENT REL.';
        default: return 'TX';
    }
}

function classifyChainTx(txType?: string, releaseType?: string): { category: TxCategory; label: string } {
    const t = String(txType || '').toLowerCase();
    const r = String(releaseType || '').toLowerCase();
    if (t === 'release') {
        if (r === 'merchant') return { category: 'merchant_release', label: 'Merchant Release' };
        if (r === 'partner') return { category: 'partner_release', label: 'Partner Release' };
        if (r === 'platform') return { category: 'platform_release', label: 'Platform Release' };
        if (r === 'agent') return { category: 'agent_release', label: 'Agent Release' };
        return { category: 'merchant_release', label: 'Release' };
    }
    return { category: 'payment', label: 'Payment' };
}

export const LedgerPDF = ({ brandName, brandColor, date, dateRange, generatedBy, receipts, splitTransactions }: LedgerPDFProps) => {
    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const color = brandColor || '#111827';

    const entries: LedgerEntry[] = [];

    // Receipts (cash + crypto)
    for (const r of receipts) {
        const isCash = String(r.paymentMethod || '').toLowerCase() === 'cash';
        const method = isCash ? 'Cash' : (r.paymentMethod || r.currency || 'Crypto');
        entries.push({
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—',
            category: isCash ? 'cash' : 'receipt',
            label: isCash ? 'Cash Payment' : 'Crypto Receipt',
            method,
            tokenAmount: isCash ? '—' : (r.totalUsd ? fmt(r.totalUsd) : '—'),
            amountUsd: r.totalUsd || 0,
            reference: r.id || '—',
            sortKey: r.createdAt || 0,
        });
    }

    // On-chain split transactions (payments + releases)
    for (const tx of splitTransactions) {
        const rawVal = Number(tx.value || 0);
        const usdVal = Number(tx.valueUsd || 0);
        const { category, label } = classifyChainTx(tx.txType, tx.releaseType);
        entries.push({
            date: tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—',
            category,
            label,
            method: tx.token || 'Token',
            tokenAmount: `${rawVal.toFixed(6)} ${tx.token || ''}`.trim(),
            amountUsd: usdVal,
            reference: tx.hash || '—',
            sortKey: tx.timestamp ? new Date(tx.timestamp).getTime() : 0,
        });
    }

    entries.sort((a, b) => b.sortKey - a.sortKey);

    // Summary stats
    const cashEntries = entries.filter(e => e.category === 'cash');
    const receiptEntries = entries.filter(e => e.category === 'receipt');
    const paymentEntries = entries.filter(e => e.category === 'payment');
    const merchantReleases = entries.filter(e => e.category === 'merchant_release');
    const partnerReleases = entries.filter(e => e.category === 'partner_release');
    const platformReleases = entries.filter(e => e.category === 'platform_release');
    const agentReleases = entries.filter(e => e.category === 'agent_release');

    const sum = (arr: LedgerEntry[]) => arr.reduce((s, e) => s + e.amountUsd, 0);
    const totalCash = sum(cashEntries);
    const totalReceipts = sum(receiptEntries);
    const totalPayments = sum(paymentEntries);
    const totalMerchantRel = sum(merchantReleases);
    const totalPartnerRel = sum(partnerReleases);
    const totalPlatformRel = sum(platformReleases);
    const totalAgentRel = sum(agentReleases);
    const grandTotal = totalCash + totalReceipts + totalPayments; // Only incoming — releases are distribution of the same funds

    // Build summary cards dynamically (only show cards that have data)
    const cards: { label: string; count: number; total: number; color: string }[] = [];
    cards.push({ label: 'Incoming Volume', count: cashEntries.length + receiptEntries.length + paymentEntries.length, total: grandTotal, color });
    if (cashEntries.length > 0) cards.push({ label: 'Cash', count: cashEntries.length, total: totalCash, color: '#F97316' });
    if (receiptEntries.length > 0) cards.push({ label: 'Crypto Receipts', count: receiptEntries.length, total: totalReceipts, color: '#3B82F6' });
    if (paymentEntries.length > 0) cards.push({ label: 'Payments', count: paymentEntries.length, total: totalPayments, color: '#3B82F6' });
    if (merchantReleases.length > 0) cards.push({ label: 'Merchant Rel.', count: merchantReleases.length, total: totalMerchantRel, color: '#10B981' });
    if (partnerReleases.length > 0) cards.push({ label: 'Partner Rel.', count: partnerReleases.length, total: totalPartnerRel, color: '#7C3AED' });
    if (platformReleases.length > 0) cards.push({ label: 'Platform Rel.', count: platformReleases.length, total: totalPlatformRel, color: '#EF4444' });
    if (agentReleases.length > 0) cards.push({ label: 'Agent Rel.', count: agentReleases.length, total: totalAgentRel, color: '#06B6D4' });

    const PER_PAGE = 30;
    const pages: LedgerEntry[][] = [];
    for (let i = 0; i < entries.length; i += PER_PAGE) pages.push(entries.slice(i, i + PER_PAGE));
    if (pages.length === 0) pages.push([]);

    return (
        <Document>
            {pages.map((rows, pi) => (
                <Page key={pi} size="A4" style={s.page}>
                    {pi === 0 && (
                        <>
                            <View style={[s.header, { borderBottomColor: color }]}>
                                <View>
                                    <Text style={[s.brandName, { color }]}>{brandName}</Text>
                                    <Text style={s.meta}>{generatedBy}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' as any }}>
                                    <Text style={s.reportTitle}>Transaction Ledger</Text>
                                    <Text style={s.meta}>PERIOD: {dateRange}</Text>
                                    <Text style={s.meta}>GENERATED: {date}</Text>
                                </View>
                            </View>

                            {/* Summary Cards — first row */}
                            <View style={s.summaryRow}>
                                {cards.slice(0, 4).map((c, i) => (
                                    <View key={i} style={[s.card, { borderTopColor: c.color }, i === Math.min(3, cards.length - 1) ? s.cardLast : {}]}>
                                        <Text style={s.cardLabel}>{c.label} ({c.count})</Text>
                                        <Text style={s.cardValue}>{fmt(c.total)}</Text>
                                    </View>
                                ))}
                            </View>
                            {/* Summary Cards — second row if needed */}
                            {cards.length > 4 && (
                                <View style={s.summaryRow}>
                                    {cards.slice(4).map((c, i) => (
                                        <View key={i} style={[s.card, { borderTopColor: c.color }, i === cards.slice(4).length - 1 ? s.cardLast : {}]}>
                                            <Text style={s.cardLabel}>{c.label} ({c.count})</Text>
                                            <Text style={s.cardValue}>{fmt(c.total)}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <Text style={[s.section, { color }]}>All Transactions ({entries.length})</Text>
                        </>
                    )}
                    {pi > 0 && (
                        <View style={{ marginBottom: 8 }}>
                            <Text style={s.meta}>{brandName} — Transaction Ledger (page {pi + 1}/{pages.length})</Text>
                        </View>
                    )}
                    <View style={s.table}>
                        <View style={s.tHead}>
                            <Text style={s.hNum}>#</Text>
                            <Text style={s.hDate}>Date</Text>
                            <Text style={s.hType}>Type</Text>
                            <Text style={s.hMethod}>Token</Text>
                            <Text style={s.hTokenAmt}>Amount</Text>
                            <Text style={s.hUsd}>USD Value</Text>
                            <Text style={s.hRef}>Reference</Text>
                        </View>
                        {rows.map((e, i) => {
                            const n = pi * PER_PAGE + i + 1;
                            return (
                                <View key={i} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}, e.category === 'cash' ? s.tRowCash : {}]}>
                                    <Text style={s.cNum}>{n}</Text>
                                    <Text style={s.cDate}>{e.date}</Text>
                                    <View style={s.cType}>
                                        <Text style={[s.badge, getBadgeStyle(e.category)]}>
                                            {getBadgeLabel(e.category)}
                                        </Text>
                                    </View>
                                    <Text style={s.cMethod}>{e.method}</Text>
                                    <Text style={s.cTokenAmt}>{e.tokenAmount}</Text>
                                    <Text style={s.cUsd}>{fmt(e.amountUsd)}</Text>
                                    <Text style={s.cRef}>
                                        {e.reference.length > 24 ? `${e.reference.slice(0, 10)}...${e.reference.slice(-8)}` : e.reference}
                                    </Text>
                                </View>
                            );
                        })}
                        {rows.length === 0 && (
                            <View style={s.tRow}>
                                <Text style={{ width: '100%', fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' }}>No transactions found for this period.</Text>
                            </View>
                        )}
                        {pi === pages.length - 1 && entries.length > 0 && (
                            <View style={s.tRowTotal}>
                                <Text style={s.cNum}></Text>
                                <Text style={[s.cDate, { fontFamily: 'Helvetica-Bold' }]}>TOTAL</Text>
                                <Text style={s.cType}></Text>
                                <Text style={[s.cMethod, { fontFamily: 'Helvetica-Bold' }]}>{entries.length}</Text>
                                <Text style={s.cTokenAmt}></Text>
                                <Text style={[s.cUsd, { fontFamily: 'Helvetica-Bold', fontSize: 9 }]}>{fmt(grandTotal)}</Text>
                                <Text style={s.cRef}></Text>
                            </View>
                        )}
                    </View>
                    <View style={s.footer}>
                        <Text style={s.footerText}>Generated via {brandName} • {new Date().toLocaleString()}</Text>
                        <Text style={s.footerText}>Page {pi + 1} of {pages.length}</Text>
                    </View>
                </Page>
            ))}
        </Document>
    );
};
