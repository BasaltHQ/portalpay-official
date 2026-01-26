import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Static styles - react-pdf requires static StyleSheet.create()
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        color: '#111827',
        fontSize: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#111827',
    },
    brandColumn: {
        flexDirection: 'column',
    },
    brandLogo: {
        width: 48,
        height: 48,
        objectFit: 'contain',
        marginBottom: 10,
    },
    brandName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    reportMetaColumn: {
        alignItems: 'flex-end',
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    metaText: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 2,
    },
    kpiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    kpiCard: {
        flexGrow: 1,
        backgroundColor: '#F9FAFB',
        padding: 12,
        marginRight: 10,
        borderTopWidth: 3,
        borderTopColor: '#111827',
        borderLeftWidth: 1,
        borderLeftColor: '#E5E7EB',
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    kpiLabel: {
        fontSize: 9,
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 6,
        fontWeight: 'bold',
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 4
    },
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    tableRowStriped: {
        backgroundColor: '#F9FAFB',
    },
    col50: { width: '50%', fontSize: 9, fontWeight: 'bold', color: '#4B5563' },
    col25: { width: '25%', fontSize: 9, fontWeight: 'bold', color: '#4B5563', textAlign: 'right' },
    cell50: { width: '50%', fontSize: 10, color: '#374151', flexDirection: 'row', alignItems: 'center' },
    cell25: { width: '25%', fontSize: 10, color: '#111827', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
    tokenIcon: {
        width: 12,
        height: 12,
        marginRight: 6,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
    },
});

const TOKEN_ICONS: Record<string, string> = {
    ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    USDC: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    USDT: "https://assets.coingecko.com/coins/images/325/small/Tether-logo.png",
    cbBTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    cbXRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
    SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
};

interface EndOfDayProps {
    brandName: string;
    logoUrl?: string;
    brandColor?: string;
    date: string;
    generatedBy: string;
    stats: {
        totalSales: number;
        totalTips: number;
        transactionCount: number;
        averageOrderValue: number;
    };
    paymentMethods: { method: string; total: number }[];
    employees?: { id: string; sales: number; tips: number; count: number; aov: number }[];
    hourly?: { hour: number; amount: number }[];
    reportTitle?: string;
    showPayments?: boolean;
    showEmployeeStats?: boolean;
    showHourlyStats?: boolean;
}

export const EndOfDayPDF = ({ brandName, logoUrl, brandColor, date, generatedBy, stats, paymentMethods, employees, hourly, reportTitle, showPayments, showEmployeeStats, showHourlyStats }: EndOfDayProps) => {
    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const color = brandColor || '#111827';

    // Default to true if undefined for backward compatibility, or strictly respect server?
    // Let's default true for payments, others false unless specified, or just trust server.
    // The server passes explicit true/false now.

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header with dynamic border color */}
                <View style={[styles.headerContainer, { borderBottomColor: color }]}>
                    <View style={styles.brandColumn}>
                        {logoUrl && (
                            /* eslint-disable-next-line jsx-a11y/alt-text */
                            <Image src={logoUrl} style={styles.brandLogo} />
                        )}
                        <Text style={[styles.brandName, { color }]}>{brandName}</Text>
                        <Text style={styles.metaText}>{generatedBy}</Text>
                    </View>
                    <View style={styles.reportMetaColumn}>
                        <Text style={styles.reportTitle}>{reportTitle || "End of Day Report"}</Text>
                        <Text style={styles.metaText}>DATE: {date}</Text>
                        <Text style={styles.metaText}>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
                    </View>
                </View>

                {/* KPI Cards with dynamic accent */}
                <View style={styles.kpiContainer}>
                    <View style={[styles.kpiCard, { borderTopColor: color }]}>
                        <Text style={styles.kpiLabel}>Total Revenue</Text>
                        <Text style={styles.kpiValue}>{fmt(stats.totalSales)}</Text>
                    </View>
                    <View style={[styles.kpiCard, { borderTopColor: color }]}>
                        <Text style={styles.kpiLabel}>Transactions</Text>
                        <Text style={styles.kpiValue}>{stats.transactionCount}</Text>
                    </View>
                    <View style={[styles.kpiCard, { borderTopColor: color }]}>
                        <Text style={styles.kpiLabel}>Avg Order Value</Text>
                        <Text style={styles.kpiValue}>{fmt(stats.averageOrderValue)}</Text>
                    </View>
                    <View style={[styles.kpiCard, { borderTopColor: color, marginRight: 0 }]}>
                        <Text style={styles.kpiLabel}>Tips Collected</Text>
                        <Text style={styles.kpiValue}>{fmt(stats.totalTips)}</Text>
                    </View>
                </View>

                {/* Payment Breakdown Table */}
                {(showPayments !== false) && (
                    <>
                        <Text style={[styles.sectionHeader, { color }]}>Payment Breakdown</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.col50}>Payment Method</Text>
                                <Text style={styles.col25}>Total Amount</Text>
                                <Text style={styles.col25}>% of Sales</Text>
                            </View>
                            {paymentMethods.map((pm, i) => {
                                const icon = TOKEN_ICONS[pm.method] || TOKEN_ICONS[pm.method.replace("cb", "")] || null;
                                const percent = stats.totalSales > 0 ? (pm.total / stats.totalSales) * 100 : 0;

                                return (
                                    <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowStriped : {}]}>
                                        <View style={styles.cell50}>
                                            {icon && <Image src={icon} style={styles.tokenIcon} />}
                                            <Text>{pm.method}</Text>
                                        </View>
                                        <Text style={styles.cell25}>{fmt(pm.total)}</Text>
                                        <Text style={styles.cell25}>{percent.toFixed(1)}%</Text>
                                    </View>
                                );
                            })}
                            {paymentMethods.length === 0 && (
                                <View style={styles.tableRow}>
                                    <Text style={{ width: '100%', fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>No transaction data available.</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* Staff Performance */}
                {(showEmployeeStats) && employees && employees.length > 0 && (
                    <>
                        <Text style={[styles.sectionHeader, { color }]}>Staff Performance</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.col50}>Staff Member</Text>
                                <Text style={styles.col25}>Orders</Text>
                                <Text style={styles.col25}>Sales</Text>
                            </View>
                            {employees.map((e, i) => (
                                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowStriped : {}]}>
                                    <Text style={styles.cell50}>{e.id}</Text>
                                    <Text style={styles.cell25}>{e.count}</Text>
                                    <Text style={styles.cell25}>{fmt(e.sales)}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Hourly Breakdown */}
                {showHourlyStats && hourly && hourly.length > 0 && (
                    <>
                        <Text style={[styles.sectionHeader, { color }]}>Hourly Performance</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.col50}>Hour</Text>
                                <Text style={styles.col25}>Volume</Text>
                                <Text style={styles.col25}></Text>
                            </View>
                            {hourly.map((h, i) => (
                                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowStriped : {}]}>
                                    <Text style={styles.cell50}>{h.hour}:00 - {h.hour + 1}:00</Text>
                                    <Text style={styles.cell25}>{fmt(h.amount)}</Text>
                                    <Text style={styles.cell25}></Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Generated via {brandName} Terminal</Text>
                    <Text style={styles.footerText}>{new Date().toLocaleString()} • Authorized by {generatedBy.substring(0, 6)}...{generatedBy.substring(38)}</Text>
                </View>
            </Page>
        </Document>
    );
};
