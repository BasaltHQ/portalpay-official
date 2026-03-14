"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { NODE_REGIONS } from "@/lib/node-regions";

type Step = "intro" | "wallet" | "identity" | "region" | "infra" | "review" | "submitted";

interface FormData {
  walletAddress: string;
  operatorName: string;
  contactEmail: string;
  regionId: string;
  endpointUrl: string;
}

export default function NodeApplyPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<FormData>({
    walletAddress: "",
    operatorName: "",
    contactEmail: "",
    regionId: "",
    endpointUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [regionSearch, setRegionSearch] = useState("");

  const primary = "#f59e0b";
  const secondary = "#ef4444";

  // Group regions by continent for the selector
  const regionsByContinent = useMemo(() => {
    const grouped: Record<string, typeof NODE_REGIONS> = {};
    for (const r of NODE_REGIONS) {
      if (!grouped[r.continent]) grouped[r.continent] = [];
      grouped[r.continent].push(r);
    }
    return grouped;
  }, []);

  const filteredRegions = useMemo(() => {
    if (!regionSearch.trim()) return regionsByContinent;
    const q = regionSearch.toLowerCase();
    const result: Record<string, typeof NODE_REGIONS> = {};
    for (const [continent, regions] of Object.entries(regionsByContinent)) {
      const matches = regions.filter(
        (r) => r.name.toLowerCase().includes(q) || r.regionId.includes(q) || continent.toLowerCase().includes(q)
      );
      if (matches.length) result[continent] = matches;
    }
    return result;
  }, [regionSearch, regionsByContinent]);

  const selectedRegion = NODE_REGIONS.find((r) => r.regionId === form.regionId);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/nodes/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setResult(data);
      setStep("submitted");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const steps: Step[] = ["intro", "wallet", "identity", "region", "infra", "review"];
  const stepIndex = steps.indexOf(step);

  const canAdvance = () => {
    switch (step) {
      case "wallet": return /^0x[a-fA-F0-9]{40}$/.test(form.walletAddress);
      case "identity": return form.operatorName.trim().length > 0 && /\S+@\S+\.\S+/.test(form.contactEmail);
      case "region": return !!form.regionId;
      case "infra": return /^https?:\/\/.+/.test(form.endpointUrl);
      default: return true;
    }
  };

  const next = () => {
    if (step === "review") { handleSubmit(); return; }
    const i = steps.indexOf(step);
    if (i < steps.length - 1) setStep(steps[i + 1]);
  };

  const prev = () => {
    const i = steps.indexOf(step);
    if (i > 0) setStep(steps[i - 1]);
  };

  // ── Shared styles ──────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px", borderRadius: 12,
    border: "1px solid rgba(245,158,11,0.2)", background: "rgba(24,24,27,0.8)",
    color: "#f4f4f5", fontSize: 16, outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const,
    color: "#71717a", marginBottom: 8, display: "block",
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] mix-blend-screen"
          style={{ background: `radial-gradient(circle, ${primary}4D 0%, transparent 70%)` }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 100, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px] mix-blend-screen"
          style={{ background: `radial-gradient(circle, ${secondary}4d 0%, transparent 70%)` }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], y: [0, -50, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full blur-[130px] mix-blend-screen"
          style={{ background: `radial-gradient(circle, ${primary}33 0%, transparent 70%)` }}
        />
      </div>

      {/* Moving Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none perspective-grid" />
      <style jsx global>{`
        .perspective-grid {
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
          animation: grid-move 20s linear infinite;
        }
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>

      {/* ── Main Card ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-xl">
        {/* Back to /nodes link */}
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <button
            onClick={() => router.push("/nodes")}
            style={{
              background: "none", border: "none", color: "#71717a", fontSize: 13,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>←</span> Back to Node Network
          </button>
        </div>

        {/* Progress bar */}
        {step !== "submitted" && (
          <div style={{ marginBottom: 24, display: "flex", gap: 4 }}>
            {steps.map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i <= stepIndex
                    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                    : "rgba(63,63,70,0.5)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        )}

        <div style={{
          background: "rgba(9,9,11,0.85)", borderRadius: 20,
          border: "1px solid rgba(245,158,11,0.1)",
          backdropFilter: "blur(40px)", overflow: "hidden",
        }}>
          <AnimatePresence mode="wait">
            {/* ── Intro ──────────────────────────────────────────── */}
            {step === "intro" && (
              <motion.div key="intro" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: 40, textAlign: "center" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 16px", borderRadius: 999, marginBottom: 24,
                  background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0baa" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#f59e0b" }}>Node Operator Application</span>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
                  Power the Network
                </h1>
                <p style={{ fontSize: 15, color: "#71717a", lineHeight: 1.7, margin: "0 0 32px" }}>
                  Deploy a BasaltSurge node in your region, process transactions, and earn 25% of platform fees via BSURGE airdrops.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", marginBottom: 32 }}>
                  {[
                    { icon: "🪙", text: "Hold 100,000 BSURGE tokens (soft stake)" },
                    { icon: "🖥️", text: "Deploy the repo with a single API key" },
                    { icon: "🌍", text: "Serve merchants in your region" },
                    { icon: "💰", text: "Earn 25% of platform fees per transaction" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, background: "rgba(24,24,27,0.6)" }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <span style={{ fontSize: 14, color: "#a1a1aa" }}>{text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={next} style={{
                  width: "100%", padding: "14px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(245,158,11,0.3)",
                }}>
                  Start Application →
                </button>
              </motion.div>
            )}

            {/* ── Wallet ─────────────────────────────────────────── */}
            {step === "wallet" && (
              <motion.div key="wallet" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: 40 }}>
                <StepHeader num="01" title="Wallet Address" subtitle="The wallet holding your BSURGE stake. Must be an EVM-compatible address." />
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Wallet Address</label>
                  <input
                    style={{ ...inputStyle, fontFamily: "monospace" }}
                    placeholder="0x..."
                    value={form.walletAddress}
                    onChange={(e) => setForm((f) => ({ ...f, walletAddress: e.target.value }))}
                    autoFocus
                  />
                  {form.walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(form.walletAddress) && (
                    <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>Invalid wallet address format</div>
                  )}
                </div>
                <NavButtons onPrev={prev} onNext={next} canAdvance={canAdvance()} />
              </motion.div>
            )}

            {/* ── Identity ───────────────────────────────────────── */}
            {step === "identity" && (
              <motion.div key="identity" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: 40 }}>
                <StepHeader num="02" title="Operator Identity" subtitle="Tell us about your organization." />
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Organization / Operator Name</label>
                    <input style={inputStyle} placeholder="Acme Hosting" value={form.operatorName} onChange={(e) => setForm((f) => ({ ...f, operatorName: e.target.value }))} autoFocus />
                  </div>
                  <div>
                    <label style={labelStyle}>Contact Email</label>
                    <input style={inputStyle} type="email" placeholder="ops@acme.com" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                  </div>
                </div>
                <NavButtons onPrev={prev} onNext={next} canAdvance={canAdvance()} />
              </motion.div>
            )}

            {/* ── Region ─────────────────────────────────────────── */}
            {step === "region" && (
              <motion.div key="region" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: 40 }}>
                <StepHeader num="03" title="Select Region" subtitle="Choose the region closest to your infrastructure." />
                <div style={{ marginBottom: 16 }}>
                  <input
                    style={{ ...inputStyle, marginBottom: 16 }}
                    placeholder="Search regions..."
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    autoFocus
                  />
                  <div style={{ maxHeight: 280, overflowY: "auto", borderRadius: 12, border: "1px solid rgba(39,39,42,0.5)" }}>
                    {Object.entries(filteredRegions).sort(([a], [b]) => a.localeCompare(b)).map(([continent, regions]) => (
                      <div key={continent}>
                        <div style={{
                          padding: "8px 16px", fontSize: 11, fontWeight: 800,
                          letterSpacing: 2, textTransform: "uppercase", color: "#f59e0b",
                          background: "rgba(24,24,27,0.8)", position: "sticky", top: 0, zIndex: 1,
                        }}>{continent}</div>
                        {regions.map((r) => (
                          <button
                            key={r.regionId}
                            onClick={() => setForm((f) => ({ ...f, regionId: r.regionId }))}
                            style={{
                              width: "100%", padding: "10px 16px", textAlign: "left",
                              background: form.regionId === r.regionId ? "rgba(245,158,11,0.15)" : "transparent",
                              border: "none", borderBottom: "1px solid rgba(39,39,42,0.3)",
                              color: form.regionId === r.regionId ? "#f59e0b" : "#a1a1aa",
                              fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between",
                              transition: "background 0.1s",
                            }}
                          >
                            <span>{r.name}</span>
                            <code style={{ fontSize: 11, color: "#52525b" }}>{r.regionId}</code>
                          </button>
                        ))}
                      </div>
                    ))}
                    {Object.keys(filteredRegions).length === 0 && (
                      <div style={{ padding: 20, textAlign: "center", color: "#52525b", fontSize: 13 }}>No regions match your search</div>
                    )}
                  </div>
                </div>
                {selectedRegion && (
                  <div style={{
                    padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                    fontSize: 13, color: "#a1a1aa",
                  }}>
                    Selected: <strong style={{ color: "#f59e0b" }}>{selectedRegion.name}</strong> · {selectedRegion.continent}
                  </div>
                )}
                <NavButtons onPrev={prev} onNext={next} canAdvance={canAdvance()} />
              </motion.div>
            )}

            {/* ── Infrastructure ──────────────────────────────────── */}
            {step === "infra" && (
              <motion.div key="infra" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: 40 }}>
                <StepHeader num="04" title="Node Endpoint" subtitle="The public URL where your node will be reachable." />
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Endpoint URL</label>
                  <input
                    style={{ ...inputStyle, fontFamily: "monospace" }}
                    placeholder="https://node.yourdomain.com"
                    value={form.endpointUrl}
                    onChange={(e) => setForm((f) => ({ ...f, endpointUrl: e.target.value }))}
                    autoFocus
                  />
                  {form.endpointUrl && !/^https?:\/\/.+/.test(form.endpointUrl) && (
                    <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>Must be a valid URL starting with https://</div>
                  )}
                  <div style={{ fontSize: 12, color: "#52525b", marginTop: 8, lineHeight: 1.6 }}>
                    This is where the platform will route traffic. You can update this later after provisioning.
                  </div>
                </div>
                <NavButtons onPrev={prev} onNext={next} canAdvance={canAdvance()} />
              </motion.div>
            )}

            {/* ── Review ─────────────────────────────────────────── */}
            {step === "review" && (
              <motion.div key="review" variants={containerVariants} initial="hidden" animate="visible" exit="exit" style={{ padding: 40 }}>
                <StepHeader num="05" title="Review Application" subtitle="Confirm your details before submitting." />

                {error && (
                  <div style={{
                    background: "rgba(127,29,29,0.5)", color: "#fca5a5", padding: 12,
                    borderRadius: 10, marginBottom: 16, fontSize: 13, border: "1px solid rgba(239,68,68,0.3)",
                  }}>{error}</div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  <ReviewRow label="Wallet" value={`${form.walletAddress.slice(0, 8)}...${form.walletAddress.slice(-6)}`} mono />
                  <ReviewRow label="Operator" value={form.operatorName} />
                  <ReviewRow label="Email" value={form.contactEmail} />
                  <ReviewRow label="Region" value={selectedRegion ? `${selectedRegion.name} (${form.regionId})` : form.regionId} />
                  <ReviewRow label="Endpoint" value={form.endpointUrl} mono />
                </div>

                <div style={{
                  padding: "12px 16px", borderRadius: 10, marginBottom: 24,
                  background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.1)",
                  fontSize: 12, color: "#71717a", lineHeight: 1.7,
                }}>
                  By submitting, you confirm that you hold at least <strong style={{ color: "#f59e0b" }}>100,000 BSURGE tokens</strong> in the wallet above. Your stake will be verified via on-chain snapshot before provisioning.
                </div>

                <NavButtons
                  onPrev={prev}
                  onNext={next}
                  canAdvance={!submitting}
                  nextLabel={submitting ? "Submitting..." : "Submit Application"}
                />
              </motion.div>
            )}

            {/* ── Submitted ──────────────────────────────────────── */}
            {step === "submitted" && result && (
              <motion.div key="submitted" variants={containerVariants} initial="hidden" animate="visible" style={{ padding: 40, textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", margin: "0 auto 24px",
                  background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))",
                  border: "2px solid rgba(34,197,94,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                }}>✓</div>

                <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px" }}>Application Submitted</h2>
                <p style={{ fontSize: 15, color: "#71717a", margin: "0 0 24px", lineHeight: 1.7 }}>
                  Your node operator application has been received. The BasaltSurge team will review and notify you.
                </p>

                <div style={{
                  padding: 20, borderRadius: 12, background: "rgba(24,24,27,0.6)",
                  border: "1px solid rgba(39,39,42,0.5)", textAlign: "left", marginBottom: 24,
                }}>
                  <ReviewRow label="Node ID" value={result.nodeId} mono />
                  <ReviewRow label="Status" value={result.status} />
                  <ReviewRow label="Region" value={result.region} />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => router.push("/nodes")}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12,
                      border: "1px solid rgba(245,158,11,0.2)", background: "transparent",
                      color: "#f59e0b", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    ← Node Network
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 12, border: "none",
                      background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                      color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Go Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function StepHeader({ num, title, subtitle }: { num: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#f59e0b", marginBottom: 6 }}>Step {num}</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.01em" }}>{title}</h2>
      <p style={{ fontSize: 14, color: "#71717a", margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(39,39,42,0.3)" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 14, color: "#e4e4e7", fontFamily: mono ? "monospace" : "inherit", maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function NavButtons({ onPrev, onNext, canAdvance, nextLabel }: {
  onPrev: () => void; onNext: () => void; canAdvance: boolean; nextLabel?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <button
        onClick={onPrev}
        style={{
          flex: 1, padding: "12px", borderRadius: 12,
          border: "1px solid rgba(63,63,70,0.5)", background: "transparent",
          color: "#a1a1aa", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}
      >
        ← Back
      </button>
      <button
        onClick={onNext}
        disabled={!canAdvance}
        style={{
          flex: 2, padding: "12px", borderRadius: 12, border: "none",
          background: canAdvance ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "rgba(63,63,70,0.5)",
          color: canAdvance ? "#fff" : "#52525b",
          fontSize: 14, fontWeight: 700, cursor: canAdvance ? "pointer" : "default",
          transition: "all 0.15s",
        }}
      >
        {nextLabel || "Continue →"}
      </button>
    </div>
  );
}
