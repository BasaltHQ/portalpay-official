"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { pdf } from "@react-pdf/renderer";
import { Download, FileSpreadsheet } from "lucide-react";
import { Form1099DAPDF } from "@/components/reports/Form1099DAPDF";

// ── Types ──────────────────────────────────────────────────────
interface KYBInfo {
  businessName: string;
  ein: string;
  dba: string;
  entityType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contactName: string;
  contactEmail: string;
  incorporationState: string;
  incorporationDate: string;
}

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

interface ReportData {
  ok: boolean;
  taxYear: number;
  isDraft: boolean;
  basisRequired: boolean;
  formData: {
    byToken: any[];
  };
  transactions: DispositionRow[];
  acquisitionCount: number;
  summary: {
    totalDispositions: number;
    totalProceeds: number;
    totalBasis: number;
    totalGainLoss: number;
    shortTermGainLoss: number;
    longTermGainLoss: number;
    proceedsByToken: Record<string, number>;
  };
  compliance: {
    pdapThreshold: number;
    exceedsPdapThreshold: boolean;
    stablecoinThreshold: number;
    exceedsStablecoinThreshold: boolean;
    recipientDeadline: string;
    paperFilingDeadline: string;
    electronicFilingDeadline: string;
    penaltyRelief: boolean;
    noncoveredCount: number;
    coveredCount: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
const taxYearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];
const ENTITY_TYPES = ["LLC","C-Corp","S-Corp","Sole Proprietor","Partnership","Non-Profit"];

function fmtDate(ts: number): string {
  if (!ts) return "Various";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}
function fmtUsd(v: number): string {
  return `$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function maskTin(tin: string): string {
  if (!tin || tin.length < 4) return tin || "";
  return "•".repeat(tin.length - 4) + tin.slice(-4);
}

const LS_KEY = "bs_1099da_kyb";

function loadKYB(): KYBInfo {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    businessName: "", ein: "", dba: "", entityType: "",
    address: "", city: "", state: "", zip: "",
    phone: "", contactName: "", contactEmail: "",
    incorporationState: "", incorporationDate: "",
  };
}

function saveKYB(kyb: KYBInfo) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(kyb)); } catch {}
}

// ── Component ──────────────────────────────────────────────────
export function Form1099DAPanel() {
  const account = useActiveAccount();
  const wallet = (account?.address || "").toLowerCase();

  // KYB State
  const [kyb, setKyb] = useState<KYBInfo>(loadKYB);
  const [kybEditing, setKybEditing] = useState(false);
  const [kybSaving, setKybSaving] = useState(false);
  const [kybSaved, setKybSaved] = useState(false);

  // Report State
  const [taxYear, setTaxYear] = useState(currentYear - 1);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [tokenFilter, setTokenFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("dateDisposed");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Persist KYB to site config
  const handleSaveKYB = useCallback(async () => {
    setKybSaving(true);
    setKybSaved(false);
    saveKYB(kyb);
    try {
      await fetch("/api/site/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet": wallet },
        body: JSON.stringify({ taxConfig: { kyb } }),
      });
      setKybSaved(true);
      setKybEditing(false);
      setTimeout(() => setKybSaved(false), 3000);
    } catch {
      setError("Failed to save KYB details.");
    } finally {
      setKybSaving(false);
    }
  }, [kyb, wallet]);

  // Load KYB from server on mount
  useEffect(() => {
    if (!wallet) return;
    (async () => {
      try {
        const r = await fetch("/api/site/config", { headers: { "x-wallet": wallet } });
        const j = await r.json();
        const serverKyb = j?.config?.taxConfig?.kyb;
        if (serverKyb && serverKyb.businessName) {
          setKyb((prev) => ({ ...prev, ...serverKyb }));
          saveKYB({ ...loadKYB(), ...serverKyb });
        }
      } catch {}
    })();
  }, [wallet]);

  // Generate report
  const generateReport = useCallback(async () => {
    if (!wallet) return;
    setLoading(true);
    setError("");
    setReportData(null);
    try {
      const r = await fetch(`/api/admin/reports/1099-da?wallet=${encodeURIComponent(wallet)}&taxYear=${taxYear}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Failed to generate report");
      setReportData(j);
    } catch (e: any) {
      setError(e?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [wallet, taxYear]);

  // Download PDF
  const downloadPdf = useCallback(async () => {
    if (!reportData) return;
    setPdfLoading(true);
    try {
      const doc = (
        <Form1099DAPDF
          taxYear={reportData.taxYear}
          isDraft={reportData.isDraft}
          basisRequired={reportData.basisRequired}
          filer={{
            name: kyb.businessName || "—",
            tin: kyb.ein || "",
            address: kyb.address || "",
            city: kyb.city || "",
            state: kyb.state || "",
            zip: kyb.zip || "",
            phone: kyb.phone || "",
          }}
          recipient={{
            name: kyb.dba || kyb.businessName || "—",
            tin: kyb.ein || "",
            address: kyb.address || "",
            city: kyb.city || "",
            state: kyb.state || "",
            zip: kyb.zip || "",
            accountNumber: wallet,
          }}
          tokenForms={reportData.formData.byToken}
          transactions={reportData.transactions}
          summary={reportData.summary}
          compliance={reportData.compliance}
          generatedAt={new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1099-DA_TY${reportData.taxYear}_${wallet.slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError("PDF generation failed: " + (e?.message || "Unknown error"));
    } finally {
      setPdfLoading(false);
    }
  }, [reportData, kyb, wallet]);

  // Export CSV
  const exportCsv = useCallback(() => {
    if (!reportData) return;
    const headers = ["Asset", "Date Acquired", "Date Disposed", "Units", "Proceeds", "Cost Basis", "Gain/Loss", "Term", "Covered", "Tx Hash"];
    const rows = reportData.transactions.map((tx) => [
      tx.token,
      fmtDate(tx.dateAcquired),
      fmtDate(tx.dateDisposed),
      tx.units.toString(),
      tx.proceeds.toFixed(2),
      tx.costBasis.toFixed(2),
      tx.gainLoss.toFixed(2),
      tx.isLongTerm ? "Long-Term" : "Short-Term",
      tx.isNoncovered ? "Noncovered" : "Covered",
      tx.txHash,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `1099-DA_TY${reportData.taxYear}_transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reportData]);

  // Filtered + sorted transactions
  const filteredTxs = (reportData?.transactions || [])
    .filter((tx) => tokenFilter === "all" || tx.token === tokenFilter)
    .sort((a, b) => {
      const aVal = sortField === "gainLoss" ? a.gainLoss : sortField === "proceeds" ? a.proceeds : a.dateDisposed;
      const bVal = sortField === "gainLoss" ? b.gainLoss : sortField === "proceeds" ? b.proceeds : b.dateDisposed;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const uniqueTokens = [...new Set((reportData?.transactions || []).map((t) => t.token))];

  // Filing season banner
  const now = new Date();
  const isFilingSeason = now.getMonth() >= 0 && now.getMonth() <= 3; // Jan-Apr

  const updateKyb = (field: keyof KYBInfo, value: string) => {
    setKyb((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Filing Season Banner */}
      {isFilingSeason && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg">📋</span>
          <div>
            <div className="text-sm font-semibold text-amber-400">Tax Filing Season</div>
            <div className="microtext text-muted-foreground">
              1099-DA returns for TY{currentYear - 1} are ready for generation. Recipient statements due by February 17, {currentYear}. Electronic IRS filing due March 31, {currentYear}.
            </div>
          </div>
        </div>
      )}

      {/* ─── KYB DETAILS SECTION ─── */}
      <div className="glass-pane rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Business Information (KYB)</h3>
            <p className="microtext text-muted-foreground">
              Required for 1099-DA filer identification. This information populates the filer/broker section of the form.
            </p>
          </div>
          <button
            className={`px-3 py-1.5 rounded-md border text-sm ${kybEditing ? "bg-foreground/10" : "hover:bg-foreground/5"}`}
            onClick={() => setKybEditing(!kybEditing)}
          >
            {kybEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {kybSaved && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-sm text-emerald-400">
            ✓ Business details saved successfully
          </div>
        )}

        {kybEditing ? (
          <div className="space-y-4">
            {/* Business Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="microtext text-muted-foreground">Legal Business Name *</label>
                <input
                  type="text"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  placeholder="e.g. Acme Corp LLC"
                  value={kyb.businessName}
                  onChange={(e) => updateKyb("businessName", e.target.value)}
                />
              </div>
              <div>
                <label className="microtext text-muted-foreground">DBA / Trade Name</label>
                <input
                  type="text"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  placeholder="e.g. Acme Payments"
                  value={kyb.dba}
                  onChange={(e) => updateKyb("dba", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="microtext text-muted-foreground">EIN / TIN *</label>
                <input
                  type="text"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  placeholder="XX-XXXXXXX"
                  value={kyb.ein}
                  onChange={(e) => updateKyb("ein", e.target.value)}
                  maxLength={11}
                />
              </div>
              <div>
                <label className="microtext text-muted-foreground">Entity Type</label>
                <select
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  value={kyb.entityType}
                  onChange={(e) => updateKyb("entityType", e.target.value)}
                >
                  <option value="">Select…</option>
                  {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="microtext text-muted-foreground">Phone</label>
                <input
                  type="tel"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  placeholder="(XXX) XXX-XXXX"
                  value={kyb.phone}
                  onChange={(e) => updateKyb("phone", e.target.value)}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="microtext text-muted-foreground">Street Address *</label>
              <input
                type="text"
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                placeholder="123 Main St, Suite 100"
                value={kyb.address}
                onChange={(e) => updateKyb("address", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="microtext text-muted-foreground">City *</label>
                <input
                  type="text"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  value={kyb.city}
                  onChange={(e) => updateKyb("city", e.target.value)}
                />
              </div>
              <div>
                <label className="microtext text-muted-foreground">State *</label>
                <select
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  value={kyb.state}
                  onChange={(e) => updateKyb("state", e.target.value)}
                >
                  <option value="">Select…</option>
                  {US_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label className="microtext text-muted-foreground">ZIP Code *</label>
                <input
                  type="text"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  maxLength={10}
                  value={kyb.zip}
                  onChange={(e) => updateKyb("zip", e.target.value)}
                />
              </div>
            </div>

            {/* Incorporation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="microtext text-muted-foreground">State of Incorporation</label>
                <select
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  value={kyb.incorporationState}
                  onChange={(e) => updateKyb("incorporationState", e.target.value)}
                >
                  <option value="">Select…</option>
                  {US_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label className="microtext text-muted-foreground">Date of Incorporation</label>
                <input
                  type="date"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  value={kyb.incorporationDate}
                  onChange={(e) => updateKyb("incorporationDate", e.target.value)}
                />
              </div>
              <div>
                <label className="microtext text-muted-foreground">Contact Email</label>
                <input
                  type="email"
                  className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                  value={kyb.contactEmail}
                  onChange={(e) => updateKyb("contactEmail", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="microtext text-muted-foreground">Contact Name</label>
              <input
                type="text"
                className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
                value={kyb.contactName}
                onChange={(e) => updateKyb("contactName", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-md border text-sm bg-foreground/10 hover:bg-foreground/15"
                onClick={handleSaveKYB}
                disabled={kybSaving || !kyb.businessName || !kyb.ein}
              >
                {kybSaving ? "Saving…" : "Save Business Details"}
              </button>
              <span className="microtext text-muted-foreground">
                {!kyb.businessName || !kyb.ein ? "Business name and EIN are required" : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md border p-3 space-y-1">
              <div className="microtext text-muted-foreground">Business Name</div>
              <div className="text-sm font-medium">{kyb.businessName || <span className="text-muted-foreground italic">Not set</span>}</div>
              {kyb.dba && <div className="microtext text-muted-foreground">DBA: {kyb.dba}</div>}
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <div className="microtext text-muted-foreground">EIN / TIN</div>
              <div className="text-sm font-medium font-mono">{kyb.ein ? maskTin(kyb.ein) : <span className="text-muted-foreground italic">Not set</span>}</div>
              {kyb.entityType && <div className="microtext text-muted-foreground">{kyb.entityType}</div>}
            </div>
            <div className="rounded-md border p-3 space-y-1">
              <div className="microtext text-muted-foreground">Address</div>
              <div className="text-sm">{kyb.address || <span className="text-muted-foreground italic">Not set</span>}</div>
              {(kyb.city || kyb.state) && <div className="microtext text-muted-foreground">{[kyb.city, kyb.state, kyb.zip].filter(Boolean).join(", ")}</div>}
            </div>
          </div>
        )}
      </div>

      {/* ─── 1099-DA REPORT GENERATOR ─── */}
      <div className="glass-pane rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold">Form 1099-DA Generator</h3>
            <p className="microtext text-muted-foreground">
              Generate IRS-compliant 1099-DA returns for digital asset transactions
            </p>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="microtext text-muted-foreground">Tax Year</label>
            <select
              className="mt-1 w-32 h-9 px-3 py-1 border rounded-md bg-background text-sm"
              value={taxYear}
              onChange={(e) => { setTaxYear(Number(e.target.value)); setReportData(null); }}
            >
              {taxYearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}{y === currentYear ? " (Draft)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            className="h-9 px-4 rounded-md border text-sm bg-foreground/10 hover:bg-foreground/15 disabled:opacity-50"
            onClick={generateReport}
            disabled={loading || !wallet}
          >
            {loading ? "Generating…" : "Generate Report"}
          </button>
          {reportData && (
            <>
              <button
                className="h-9 px-4 rounded-md border text-sm hover:bg-foreground/5 disabled:opacity-50 inline-flex items-center gap-1.5"
                onClick={downloadPdf}
                disabled={pdfLoading}
              >
                <Download size={14} />
                {pdfLoading ? "Rendering…" : "Download PDF"}
              </button>
              <button
                className="h-9 px-4 rounded-md border text-sm hover:bg-foreground/5 inline-flex items-center gap-1.5"
                onClick={exportCsv}
              >
                <FileSpreadsheet size={14} />
                Export CSV
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Report Results */}
        {reportData && (
          <div className="space-y-5">
            {/* Draft Banner */}
            {reportData.isDraft && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
                ⚠ <strong>DRAFT — NOT FOR FILING.</strong> This report contains incomplete data for the current tax year {reportData.taxYear}. The data is preliminary and subject to change.
              </div>
            )}

            {/* Penalty Relief */}
            {reportData.compliance.penaltyRelief && !reportData.isDraft && (
              <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-sm text-blue-400">
                ℹ <strong>TY2025 Transitional Relief.</strong> Good-faith penalty relief applies for filing and furnishing Forms 1099-DA for 2025 transactions.
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-4 space-y-1">
                <div className="microtext text-muted-foreground">Total Proceeds</div>
                <div className="text-xl font-bold">{fmtUsd(reportData.summary.totalProceeds)}</div>
                <div className="microtext text-muted-foreground">
                  {reportData.compliance.exceedsPdapThreshold
                    ? <span className="text-amber-400">⬆ Exceeds $600 threshold</span>
                    : <span className="text-emerald-400">Below $600 threshold</span>}
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="microtext text-muted-foreground">Cost Basis</div>
                <div className="text-xl font-bold">
                  {reportData.basisRequired ? fmtUsd(reportData.summary.totalBasis) : "N/A"}
                </div>
                <div className="microtext text-muted-foreground">
                  {reportData.basisRequired ? "Required for TY2026+" : "Optional for TY2025"}
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="microtext text-muted-foreground">Net Gain / (Loss)</div>
                <div className={`text-xl font-bold ${reportData.summary.totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {reportData.summary.totalGainLoss >= 0 ? "" : "("}
                  {fmtUsd(reportData.summary.totalGainLoss)}
                  {reportData.summary.totalGainLoss < 0 ? ")" : ""}
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="microtext text-muted-foreground">Dispositions</div>
                <div className="text-xl font-bold">{reportData.summary.totalDispositions}</div>
                <div className="microtext text-muted-foreground">
                  {reportData.compliance.coveredCount} covered, {reportData.compliance.noncoveredCount} noncovered
                </div>
              </div>
            </div>

            {/* Gain/Loss Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border p-4 flex items-center justify-between">
                <div>
                  <div className="microtext text-muted-foreground">Short-Term Gain/(Loss)</div>
                  <div className={`text-lg font-semibold ${reportData.summary.shortTermGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtUsd(reportData.summary.shortTermGainLoss)}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Ordinary rates
                </span>
              </div>
              <div className="rounded-lg border p-4 flex items-center justify-between">
                <div>
                  <div className="microtext text-muted-foreground">Long-Term Gain/(Loss)</div>
                  <div className={`text-lg font-semibold ${reportData.summary.longTermGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtUsd(reportData.summary.longTermGainLoss)}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Capital gains rates
                </span>
              </div>
            </div>

            {/* Compliance Details */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-sm font-semibold">Compliance Details</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="microtext text-muted-foreground">Recipient Deadline</div>
                  <div className="text-sm">{reportData.compliance.recipientDeadline}</div>
                </div>
                <div>
                  <div className="microtext text-muted-foreground">IRS E-Filing Deadline</div>
                  <div className="text-sm">{reportData.compliance.electronicFilingDeadline}</div>
                </div>
                <div>
                  <div className="microtext text-muted-foreground">Paper Filing Deadline</div>
                  <div className="text-sm">{reportData.compliance.paperFilingDeadline}</div>
                </div>
                <div>
                  <div className="microtext text-muted-foreground">Penalty Relief</div>
                  <div className="text-sm">{reportData.compliance.penaltyRelief ? "✓ Good-faith relief" : "Standard penalties apply"}</div>
                </div>
              </div>
            </div>

            {/* Transaction Detail Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm font-semibold">Transaction Details</div>
                <div className="flex items-center gap-2">
                  {/* Token Filter */}
                  <select
                    className="h-8 px-2 border rounded-md bg-background text-xs"
                    value={tokenFilter}
                    onChange={(e) => setTokenFilter(e.target.value)}
                  >
                    <option value="all">All Tokens</option>
                    {uniqueTokens.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {/* Sort */}
                  <select
                    className="h-8 px-2 border rounded-md bg-background text-xs"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                  >
                    <option value="dateDisposed">Date Disposed</option>
                    <option value="proceeds">Proceeds</option>
                    <option value="gainLoss">Gain/Loss</option>
                  </select>
                  <button
                    className="h-8 px-2 border rounded-md text-xs hover:bg-foreground/5"
                    onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                  >
                    {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-foreground/5">
                      <th className="text-left p-2 font-medium text-muted-foreground text-xs">Asset</th>
                      <th className="text-left p-2 font-medium text-muted-foreground text-xs">Acquired</th>
                      <th className="text-left p-2 font-medium text-muted-foreground text-xs">Disposed</th>
                      <th className="text-right p-2 font-medium text-muted-foreground text-xs">Units</th>
                      <th className="text-right p-2 font-medium text-muted-foreground text-xs">Proceeds</th>
                      <th className="text-right p-2 font-medium text-muted-foreground text-xs">Basis</th>
                      <th className="text-right p-2 font-medium text-muted-foreground text-xs">Gain/(Loss)</th>
                      <th className="text-center p-2 font-medium text-muted-foreground text-xs">Term</th>
                      <th className="text-center p-2 font-medium text-muted-foreground text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center p-6 text-muted-foreground">
                          No dispositions found for the selected criteria.
                        </td>
                      </tr>
                    )}
                    {filteredTxs.map((tx, idx) => (
                      <tr key={idx} className="border-b hover:bg-foreground/5 transition-colors">
                        <td className="p-2 font-medium">{tx.token}</td>
                        <td className="p-2 text-muted-foreground">{fmtDate(tx.dateAcquired)}</td>
                        <td className="p-2">{fmtDate(tx.dateDisposed)}</td>
                        <td className="p-2 text-right font-mono text-xs">{tx.units.toFixed(6)}</td>
                        <td className="p-2 text-right">{fmtUsd(tx.proceeds)}</td>
                        <td className="p-2 text-right text-muted-foreground">
                          {reportData.basisRequired ? fmtUsd(tx.costBasis) : "—"}
                        </td>
                        <td className={`p-2 text-right font-medium ${tx.gainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {tx.gainLoss >= 0 ? "" : "("}
                          {fmtUsd(tx.gainLoss)}
                          {tx.gainLoss < 0 ? ")" : ""}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${tx.isLongTerm
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-orange-500/10 text-orange-400"
                            }`}
                          >
                            {tx.isLongTerm ? "LT" : "ST"}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${tx.isNoncovered
                              ? "bg-gray-500/10 text-gray-400"
                              : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {tx.isNoncovered ? "NC" : "C"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTxs.length > 0 && (
                <div className="microtext text-muted-foreground">
                  Showing {filteredTxs.length} of {reportData.transactions.length} dispositions
                  {tokenFilter !== "all" && ` (filtered to ${tokenFilter})`}
                </div>
              )}
            </div>

            {/* IRS Notice */}
            <div className="rounded-md border p-4 bg-foreground/5 space-y-2">
              <div className="text-sm font-semibold">IRS Regulatory Notes</div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>This form is prepared by BasaltSurge as a PDAP (Processor of Digital Asset Payments) broker per TD 9989.</li>
                <li>De minimis reporting threshold: $600 annual aggregate per recipient.</li>
                <li>Cost basis computed using per-wallet FIFO (First-In, First-Out) methodology per IRC §1012.</li>
                <li>Noncovered securities (Box 9): Assets acquired before Jan 1, 2026, or transferred from external wallet.</li>
                {reportData.basisRequired
                  ? <li>TY{reportData.taxYear}: Both gross proceeds (Box 1f) and cost basis (Box 1g) are reported for covered securities.</li>
                  : <li>TY{reportData.taxYear}: Gross proceeds (Box 1f) are reported. Cost basis is computed for informational purposes only.</li>
                }
                <li>Form 1099-DA must be e-filed with the IRS via IRIS (Information Returns Intake System).</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Form1099DAPanel;
