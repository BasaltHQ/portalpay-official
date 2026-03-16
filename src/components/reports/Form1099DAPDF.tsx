"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Types ──────────────────────────────────────────────────────
interface DispositionRow {
  token: string;
  tokenName: string;
  assetCode: string;
  units: number;
  dateAcquired: number;
  dateDisposed: number;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  isLongTerm: boolean;
  txHash: string;
  isNoncovered: boolean;
  reliedOnCustomerInfo: boolean;
}

interface TokenFormData {
  box1a: string;
  box1b: string;
  box1c: number;
  box1f: number;
  box1g: number | null;
  box2: boolean;
  box3a: string;
  box4: number;
  box7: boolean;
  box9: boolean;
  box11a: string | null;
  box11b: number | null;
  transactionCount: number;
  gainLoss: number;
}

interface FilerInfo {
  name: string;
  tin: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface RecipientInfo {
  name: string;
  tin: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  accountNumber: string;
}

interface Form1099DAPDFProps {
  taxYear: number;
  isDraft: boolean;
  basisRequired: boolean;
  filer: FilerInfo;
  recipient: RecipientInfo;
  tokenForms: TokenFormData[];
  transactions: DispositionRow[];
  summary: {
    totalDispositions: number;
    totalProceeds: number;
    totalBasis: number;
    totalGainLoss: number;
    shortTermGainLoss: number;
    longTermGainLoss: number;
  };
  compliance: {
    exceedsPdapThreshold: boolean;
    penaltyRelief: boolean;
    recipientDeadline: string;
    electronicFilingDeadline: string;
  };
  generatedAt: string;
}

// ── Styles ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  // Cover page
  coverHeader: {
    borderBottom: "3pt solid #0f172a",
    paddingBottom: 12,
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  coverSubtitle: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 2,
  },
  coverMeta: {
    fontSize: 9,
    color: "#64748b",
  },
  draftWatermark: {
    position: "absolute",
    top: 300,
    left: 100,
    fontSize: 60,
    fontFamily: "Helvetica-Bold",
    color: "#ef444420",
    transform: "rotate(-30deg)",
  },
  // Summary cards
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 12,
  },
  summaryCard: {
    flex: 1,
    border: "1pt solid #e2e8f0",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  summaryLabel: {
    fontSize: 7.5,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  // Form page
  formBorder: {
    border: "1.5pt solid #0f172a",
    padding: 0,
  },
  formHeader: {
    backgroundColor: "#0f172a",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  formHeaderText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  formHeaderSub: {
    fontSize: 8,
    color: "#94a3b8",
  },
  formRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #cbd5e1",
  },
  formCell: {
    padding: 6,
    borderRight: "0.5pt solid #cbd5e1",
    flex: 1,
  },
  formCellLast: {
    padding: 6,
    flex: 1,
  },
  formCellLabel: {
    fontSize: 6.5,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  formCellValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  boxLabel: {
    fontSize: 6,
    color: "#94a3b8",
    marginBottom: 1,
  },
  // Section dividers
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    borderBottom: "1pt solid #0f172a",
    paddingBottom: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  // Schedule table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 2,
  },
  tableHeaderCell: {
    padding: 5,
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e2e8f0",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    padding: 4,
    fontSize: 7.5,
  },
  gainText: { color: "#16a34a" },
  lossText: { color: "#dc2626" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
    borderTop: "0.5pt solid #e2e8f0",
    paddingTop: 6,
  },
  // Compliance notice
  notice: {
    marginTop: 12,
    padding: 8,
    border: "1pt solid #e2e8f0",
    borderRadius: 3,
    backgroundColor: "#fffbeb",
  },
  noticeText: {
    fontSize: 7.5,
    color: "#92400e",
    lineHeight: 1.4,
  },
});

// ── Helpers ────────────────────────────────────────────────────
function fmtDate(ts: number): string {
  if (!ts) return "Various";
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtUsd(v: number): string {
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtUnits(v: number): string {
  if (v === 0) return "0";
  if (v >= 1) return v.toFixed(6);
  return v.toFixed(8);
}

function truncHash(hash: string): string {
  if (!hash) return "—";
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

// Column widths for schedule table
const COL_W = { asset: "12%", acquired: "11%", disposed: "11%", units: "12%", proceeds: "13%", basis: "13%", gainLoss: "13%", term: "8%", status: "7%" };

// ── Document ───────────────────────────────────────────────────
export function Form1099DAPDF(props: Form1099DAPDFProps) {
  const {
    taxYear, isDraft, basisRequired, filer, recipient,
    tokenForms, transactions, summary, compliance, generatedAt,
  } = props;

  const ROWS_PER_PAGE = 28;

  return (
    <Document>
      {/* ─── COVER / TRANSMITTAL PAGE ─── */}
      <Page size="LETTER" style={s.page}>
        {isDraft && <Text style={s.draftWatermark}>DRAFT — NOT FOR FILING</Text>}

        <View style={s.coverHeader}>
          <Text style={s.coverTitle}>IRS Form 1099-DA</Text>
          <Text style={s.coverSubtitle}>Digital Asset Proceeds From Broker Transactions</Text>
          <Text style={s.coverMeta}>Tax Year {taxYear} • Generated {generatedAt}</Text>
        </View>

        {/* Filer & Recipient Info */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View style={[s.summaryCard, { flex: 1 }]}>
            <Text style={s.summaryLabel}>Filer / Broker — BasaltSurge (PDAP)</Text>
            <Text style={[s.formCellValue, { marginBottom: 2 }]}>{filer.name || "—"}</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>TIN: {filer.tin || "—"}</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>{filer.address || "—"}</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>
              {[filer.city, filer.state, filer.zip].filter(Boolean).join(", ") || "—"}
            </Text>
            {filer.phone && <Text style={{ fontSize: 8, color: "#475569" }}>Tel: {filer.phone}</Text>}
          </View>
          <View style={[s.summaryCard, { flex: 1 }]}>
            <Text style={s.summaryLabel}>Recipient</Text>
            <Text style={[s.formCellValue, { marginBottom: 2 }]}>{recipient.name || "—"}</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>TIN: {recipient.tin || "—"}</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>{recipient.address || "—"}</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>
              {[recipient.city, recipient.state, recipient.zip].filter(Boolean).join(", ") || "—"}
            </Text>
            {recipient.accountNumber && (
              <Text style={{ fontSize: 8, color: "#475569" }}>Account: {recipient.accountNumber}</Text>
            )}
          </View>
        </View>

        {/* Summary Stats */}
        <Text style={s.sectionTitle}>Summary</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Total Proceeds</Text>
            <Text style={s.summaryValue}>{fmtUsd(summary.totalProceeds)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Cost Basis</Text>
            <Text style={s.summaryValue}>{basisRequired ? fmtUsd(summary.totalBasis) : "N/A (TY<2026)"}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Net Gain / (Loss)</Text>
            <Text style={[s.summaryValue, summary.totalGainLoss >= 0 ? s.gainText : s.lossText]}>
              {fmtUsd(summary.totalGainLoss)}
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Dispositions</Text>
            <Text style={s.summaryValue}>{summary.totalDispositions}</Text>
          </View>
        </View>

        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Short-Term Gain/(Loss)</Text>
            <Text style={[s.summaryValue, summary.shortTermGainLoss >= 0 ? s.gainText : s.lossText]}>
              {fmtUsd(summary.shortTermGainLoss)}
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Long-Term Gain/(Loss)</Text>
            <Text style={[s.summaryValue, summary.longTermGainLoss >= 0 ? s.gainText : s.lossText]}>
              {fmtUsd(summary.longTermGainLoss)}
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Reporting Threshold</Text>
            <Text style={s.summaryValue}>
              {compliance.exceedsPdapThreshold ? "✓ Exceeds $600" : "Below $600"}
            </Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Filing Deadline</Text>
            <Text style={s.summaryValue}>{compliance.electronicFilingDeadline}</Text>
          </View>
        </View>

        {/* Compliance Notice */}
        <View style={s.notice}>
          <Text style={s.noticeText}>
            {isDraft
              ? "⚠ DRAFT: This report is based on incomplete data for the current tax year. Do not file this version with the IRS."
              : compliance.penaltyRelief
                ? "ℹ TY2025 Transitional Relief: Good-faith penalty relief applies. The IRS will not impose penalties for brokers making a good-faith effort to file accurate and timely Forms 1099-DA for 2025 transactions."
                : `This Form 1099-DA covers transactions effected during calendar year ${taxYear}. Recipient statements must be furnished by ${compliance.recipientDeadline}. Electronic filing with the IRS is due by ${compliance.electronicFilingDeadline}.`}
          </Text>
          {!basisRequired && !isDraft && (
            <Text style={[s.noticeText, { marginTop: 4 }]}>
              Note: For TY{taxYear}, brokers are required to report gross proceeds only. Cost basis has been computed for informational purposes but is not required on the filed form.
            </Text>
          )}
        </View>

        <View style={s.footer}>
          <Text>Form 1099-DA • Tax Year {taxYear}</Text>
          <Text>Page 1 — Cover / Transmittal</Text>
        </View>
      </Page>

      {/* ─── IRS FORM 1099-DA PAGES (one per token) ─── */}
      {tokenForms.map((tf, idx) => (
        <Page key={`form-${idx}`} size="LETTER" style={s.page}>
          {isDraft && <Text style={s.draftWatermark}>DRAFT</Text>}

          <View style={s.formBorder}>
            {/* Header Bar */}
            <View style={s.formHeader}>
              <View>
                <Text style={s.formHeaderText}>Form 1099-DA</Text>
                <Text style={s.formHeaderSub}>Digital Asset Proceeds From Broker Transactions</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.formHeaderText}>{taxYear}</Text>
                <Text style={s.formHeaderSub}>OMB No. 1545-XXXX</Text>
              </View>
            </View>

            {/* Filer / Recipient Row */}
            <View style={s.formRow}>
              <View style={[s.formCell, { flex: 2 }]}>
                <Text style={s.formCellLabel}>Filer's name, street address, city or town, state, and ZIP code</Text>
                <Text style={s.formCellValue}>{filer.name}</Text>
                <Text style={{ fontSize: 8 }}>{filer.address}</Text>
                <Text style={{ fontSize: 8 }}>{filer.city}, {filer.state} {filer.zip}</Text>
              </View>
              <View style={s.formCellLast}>
                <Text style={s.formCellLabel}>Filer's TIN</Text>
                <Text style={s.formCellValue}>{filer.tin || "XX-XXXXXXX"}</Text>
              </View>
            </View>

            <View style={s.formRow}>
              <View style={[s.formCell, { flex: 2 }]}>
                <Text style={s.formCellLabel}>Recipient's name, address, city, state, ZIP</Text>
                <Text style={s.formCellValue}>{recipient.name}</Text>
                <Text style={{ fontSize: 8 }}>{recipient.address}</Text>
                <Text style={{ fontSize: 8 }}>{recipient.city}, {recipient.state} {recipient.zip}</Text>
              </View>
              <View style={s.formCellLast}>
                <Text style={s.formCellLabel}>Recipient's TIN</Text>
                <Text style={s.formCellValue}>{recipient.tin || "XXX-XX-XXXX"}</Text>
              </View>
            </View>

            {/* Box Row 1: Asset identification */}
            <View style={s.formRow}>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 1a — Code for digital asset</Text>
                <Text style={s.formCellValue}>{tf.box1a}</Text>
              </View>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 1b — Name of digital asset</Text>
                <Text style={s.formCellValue}>{tf.box1b}</Text>
              </View>
              <View style={s.formCellLast}>
                <Text style={s.boxLabel}>Box 1c — Number of units</Text>
                <Text style={s.formCellValue}>{fmtUnits(tf.box1c)}</Text>
              </View>
            </View>

            {/* Box Row 2: Dates (aggregated) */}
            <View style={s.formRow}>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 1d — Date acquired</Text>
                <Text style={s.formCellValue}>Various</Text>
              </View>
              <View style={s.formCellLast}>
                <Text style={s.boxLabel}>Box 1e — Date sold or disposed</Text>
                <Text style={s.formCellValue}>Various</Text>
              </View>
            </View>

            {/* Box Row 3: Financials */}
            <View style={s.formRow}>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 1f — Proceeds</Text>
                <Text style={[s.formCellValue, { fontSize: 12 }]}>{fmtUsd(tf.box1f)}</Text>
              </View>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 1g — Cost or other basis</Text>
                <Text style={[s.formCellValue, { fontSize: 12 }]}>
                  {tf.box1g !== null ? fmtUsd(tf.box1g) : "N/A"}
                </Text>
              </View>
              <View style={s.formCellLast}>
                <Text style={s.boxLabel}>Gain / (Loss)</Text>
                <Text style={[s.formCellValue, { fontSize: 12 }, tf.gainLoss >= 0 ? s.gainText : s.lossText]}>
                  {fmtUsd(tf.gainLoss)}
                </Text>
              </View>
            </View>

            {/* Box Row 4: Checkboxes */}
            <View style={s.formRow}>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 2 — Basis reported to IRS</Text>
                <Text style={s.formCellValue}>{tf.box2 ? "☑ Yes" : "☐ No"}</Text>
              </View>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 3a — Reported to IRS</Text>
                <Text style={s.formCellValue}>{tf.box3a === "G" ? "Gross proceeds" : "Net proceeds"}</Text>
              </View>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 4 — Fed. tax withheld</Text>
                <Text style={s.formCellValue}>{fmtUsd(tf.box4)}</Text>
              </View>
              <View style={s.formCellLast}>
                <Text style={s.boxLabel}>Box 7 — Cash proceeds only</Text>
                <Text style={s.formCellValue}>{tf.box7 ? "☑ Yes" : "☐ No"}</Text>
              </View>
            </View>

            {/* Box Row 5: Status/Coverage */}
            <View style={[s.formRow, { borderBottom: 0 }]}>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 9 — Noncovered security</Text>
                <Text style={s.formCellValue}>{tf.box9 ? "☑ Yes" : "☐ No"}</Text>
              </View>
              <View style={s.formCell}>
                <Text style={s.boxLabel}>Box 11a — Optional method</Text>
                <Text style={s.formCellValue}>{tf.box11a === "S" ? "Stablecoin" : "—"}</Text>
              </View>
              <View style={s.formCellLast}>
                <Text style={s.boxLabel}>Transactions</Text>
                <Text style={s.formCellValue}>{tf.transactionCount}</Text>
              </View>
            </View>
          </View>

          <View style={s.footer}>
            <Text>Form 1099-DA • Tax Year {taxYear} • {tf.box1b}</Text>
            <Text>Page {idx + 2}</Text>
          </View>
        </Page>
      ))}

      {/* ─── SCHEDULE OF DIGITAL ASSET TRANSACTIONS ─── */}
      {Array.from({ length: Math.max(1, Math.ceil(transactions.length / ROWS_PER_PAGE)) }).map((_, pageIdx) => {
        const start = pageIdx * ROWS_PER_PAGE;
        const pageRows = transactions.slice(start, start + ROWS_PER_PAGE);
        const pageNum = tokenForms.length + 2 + pageIdx;
        return (
          <Page key={`sched-${pageIdx}`} size="LETTER" style={[s.page, { paddingTop: 30, paddingBottom: 30 }]}>
            {isDraft && <Text style={s.draftWatermark}>DRAFT</Text>}

            {pageIdx === 0 && (
              <Text style={s.sectionTitle}>Schedule of Digital Asset Transactions</Text>
            )}

            {/* Table Header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderCell, { width: COL_W.asset }]}>Asset</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.acquired }]}>Acquired</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.disposed }]}>Disposed</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.units, textAlign: "right" }]}>Units</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.proceeds, textAlign: "right" }]}>Proceeds</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.basis, textAlign: "right" }]}>Basis</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.gainLoss, textAlign: "right" }]}>Gain/(Loss)</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.term, textAlign: "center" }]}>Term</Text>
              <Text style={[s.tableHeaderCell, { width: COL_W.status, textAlign: "center" }]}>Cov.</Text>
            </View>

            {/* Table Rows */}
            {pageRows.map((tx, rIdx) => (
              <View key={rIdx} style={rIdx % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { width: COL_W.asset }]}>{tx.token}</Text>
                <Text style={[s.tableCell, { width: COL_W.acquired }]}>{fmtDate(tx.dateAcquired)}</Text>
                <Text style={[s.tableCell, { width: COL_W.disposed }]}>{fmtDate(tx.dateDisposed)}</Text>
                <Text style={[s.tableCell, { width: COL_W.units, textAlign: "right" }]}>{fmtUnits(tx.units)}</Text>
                <Text style={[s.tableCell, { width: COL_W.proceeds, textAlign: "right" }]}>{fmtUsd(tx.proceeds)}</Text>
                <Text style={[s.tableCell, { width: COL_W.basis, textAlign: "right" }]}>
                  {basisRequired ? fmtUsd(tx.costBasis) : "—"}
                </Text>
                <Text style={[
                  s.tableCell,
                  { width: COL_W.gainLoss, textAlign: "right" },
                  tx.gainLoss >= 0 ? s.gainText : s.lossText,
                ]}>
                  {fmtUsd(tx.gainLoss)}
                </Text>
                <Text style={[s.tableCell, { width: COL_W.term, textAlign: "center" }]}>
                  {tx.isLongTerm ? "LT" : "ST"}
                </Text>
                <Text style={[s.tableCell, { width: COL_W.status, textAlign: "center" }]}>
                  {tx.isNoncovered ? "NC" : "C"}
                </Text>
              </View>
            ))}

            {/* Empty state */}
            {transactions.length === 0 && pageIdx === 0 && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ fontSize: 10, color: "#94a3b8" }}>
                  No digital asset dispositions recorded for tax year {taxYear}.
                </Text>
              </View>
            )}

            {/* Running total on last page */}
            {pageIdx === Math.ceil(transactions.length / ROWS_PER_PAGE) - 1 && transactions.length > 0 && (
              <View style={[s.tableRow, { backgroundColor: "#f1f5f9", borderTop: "1pt solid #0f172a" }]}>
                <Text style={[s.tableCell, { width: COL_W.asset, fontFamily: "Helvetica-Bold" }]}>TOTAL</Text>
                <Text style={[s.tableCell, { width: COL_W.acquired }]} />
                <Text style={[s.tableCell, { width: COL_W.disposed }]} />
                <Text style={[s.tableCell, { width: COL_W.units }]} />
                <Text style={[s.tableCell, { width: COL_W.proceeds, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {fmtUsd(summary.totalProceeds)}
                </Text>
                <Text style={[s.tableCell, { width: COL_W.basis, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {basisRequired ? fmtUsd(summary.totalBasis) : "—"}
                </Text>
                <Text style={[
                  s.tableCell,
                  { width: COL_W.gainLoss, textAlign: "right", fontFamily: "Helvetica-Bold" },
                  summary.totalGainLoss >= 0 ? s.gainText : s.lossText,
                ]}>
                  {fmtUsd(summary.totalGainLoss)}
                </Text>
                <Text style={[s.tableCell, { width: COL_W.term }]} />
                <Text style={[s.tableCell, { width: COL_W.status }]} />
              </View>
            )}

            <View style={s.footer}>
              <Text>Schedule of Digital Asset Transactions • TY{taxYear}</Text>
              <Text>Page {pageNum}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

export default Form1099DAPDF;
