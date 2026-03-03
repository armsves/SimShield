"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { STORES } from "@/lib/stores";

type Decision = "approve" | "deny" | "clarify" | null;

interface ValidationResult {
  decision: Decision;
  score: number;
  factors: { name: string; impact: string; description: string; points?: number }[];
  suggestBlockCard?: boolean;
}

const API_LABELS: Record<string, string> = {
  sim_swap: "SIM Swap",
  location_retrieval: "Location Retrieval",
  location_verification: "Location Verification",
  device_swap: "Device Swap",
  kyc_match: "KYC Match",
};

export default function SimShieldPOS() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("fira-montjuic");
  const [posLat, setPosLat] = useState("");
  const [posLng, setPosLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiTimings, setApiTimings] = useState<{ api: string; ms: number }[]>([]);
  const [totalLatency, setTotalLatency] = useState(0);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdictText, setVerdictText] = useState("");
  const [denialCaseId, setDenialCaseId] = useState<string | null>(null);
  const [denialStatus, setDenialStatus] = useState<"pending" | "resolved" | null>(null);
  const [denialApproved, setDenialApproved] = useState<boolean | null>(null);

  // Set default store on mount
  useEffect(() => {
    const store = STORES.find((s) => s.id === "fira-montjuic");
    if (store) {
      setPosLat(store.latitude.toString());
      setPosLng(store.longitude.toString());
      setSelectedStoreId("fira-montjuic");
    }
  }, []);

  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    if (storeId === "custom") {
      setPosLat("");
      setPosLng("");
    } else {
      const store = STORES.find((s) => s.id === storeId);
      if (store) {
        setPosLat(store.latitude.toString());
        setPosLng(store.longitude.toString());
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setVerdictText("");
    setApiTimings([]);
    setDenialCaseId(null);
    setDenialStatus(null);
    setDenialApproved(null);
    setLoading(true);
    const startTime = performance.now();

    const lat = parseFloat(posLat);
    const lng = parseFloat(posLng);
    const amountCents = Math.round(parseFloat(amount || "0") * 100);

    if (!phoneNumber || isNaN(lat) || isNaN(lng) || amountCents <= 0) {
      setError("Please fill phone, amount, and select a store");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/validate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\s/g, ""),
          posLatitude: lat,
          posLongitude: lng,
          amountCents,
        }),
      });

      const elapsed = Math.round(performance.now() - startTime);
      setTotalLatency(elapsed);

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Validation failed");
        setLoading(false);
        return;
      }

      setResult({
        decision: data.decision,
        score: data.score,
        factors: data.factors || [],
        suggestBlockCard: data.suggestBlockCard,
      });
      setApiTimings(data.apiTimings || []);

      // On deny: trigger denial review flow (2 mock API calls)
      if (data.decision === "deny") {
        setDenialStatus("pending");
        try {
          const submitRes = await fetch("/api/denial/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phoneNumber: phoneNumber.replace(/\s/g, ""),
              amountCents,
              posLatitude: lat,
              posLongitude: lng,
            }),
          });
          const submitData = await submitRes.json();
          if (submitRes.ok && submitData.id) {
            setDenialCaseId(submitData.id);
            // Poll until resolved
            const pollStatus = async () => {
              const statusRes = await fetch("/api/denial/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: submitData.id }),
              });
              const statusData = await statusRes.json();
              if (statusRes.ok && statusData.status === "resolved") {
                setDenialStatus("resolved");
                setDenialApproved(statusData.approved);
                return;
              }
              setTimeout(pollStatus, 400);
            };
            pollStatus();
          }
        } catch {
          setDenialStatus(null);
        }
      }

      // Typewriter verdict from factors
      const lines = (data.factors?.map((f: { description?: string }) => f.description) || [])
        .filter((d): d is string => typeof d === "string");
      const score = typeof data.score === "number" ? data.score : 0;
      const verdict = lines.length > 0
        ? lines.join(". ") + ` Confidence: ${score}%.`
        : `Score: ${score}. Confidence: ${score}%.`;
      let idx = 0;
      setVerdictText("");
      const interval = setInterval(() => {
        if (idx < verdict.length) {
          setVerdictText((t) => t + verdict[idx]);
          idx++;
        } else {
          clearInterval(interval);
        }
      }, 15);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const getDecisionConfig = () => {
    if (!result) return null;
    switch (result.decision) {
      case "approve":
        return { bg: "var(--approved)", text: "APPROVED", desc: "Process payment" };
      case "deny":
        return { bg: "var(--blocked)", text: "BLOCKED", desc: "Reject transaction" };
      case "clarify":
        return { bg: "var(--escalate)", text: "ESCALATED", desc: "Contact customer" };
      default:
        return null;
    }
  };

  const config = result ? getDecisionConfig() : null;
  const showCustomCoords = selectedStoreId === "custom" || !selectedStoreId;
  const showEscalation = result && result.decision === "clarify" && result.score >= 30 && result.score <= 70;

  // Map factors to API bar colors
  const getApiBarStatus = (apiId: string) => {
    if (!result) return "pending";
    const factors = result.factors;
    if (apiId === "sim_swap") {
      if (factors.some((f) => f.name === "sim_swap_detected")) return "risk";
      if (factors.some((f) => f.name === "no_sim_swap")) return "clear";
      return "flag";
    }
    if (apiId === "location_retrieval" || apiId === "location_verification") {
      if (factors.some((f) => f.name === "location_match")) return "clear";
      if (factors.some((f) => f.name === "location_mismatch")) return "risk";
      if (factors.some((f) => f.name.includes("location"))) return "flag";
      return "pending";
    }
    if (apiId === "device_swap") {
      if (factors.some((f) => f.name === "device_swap_detected")) return "risk";
      if (factors.some((f) => f.name === "no_device_swap")) return "clear";
      return "flag";
    }
    if (apiId === "kyc_match") {
      if (factors.some((f) => f.name === "kyc_match")) return "clear";
      if (factors.some((f) => f.name === "kyc_mismatch")) return "risk";
      if (factors.some((f) => f.name.includes("kyc"))) return "flag";
      return "pending";
    }
    return "pending";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <header className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--teal-light)] text-sm">
          ← Back
        </Link>
        <Image src="/SimShield-logo.png" alt="SimShield" width={100} height={40} />
        <div className="w-12" />
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left panel — 25% */}
        <div className="w-full lg:w-1/4 bg-[var(--bg-surface)] border-r border-[var(--border)] p-6 flex flex-col">
          <h2 className="text-[var(--text-primary)] font-semibold mb-6">
            Transaction context
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[var(--text-secondary)] text-sm mb-1">
                Phone number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+34640030004"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] text-sm mb-1">
                Amount (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] text-sm mb-1">
                POS location
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)]"
                disabled={loading}
              >
                {STORES.filter((s) => s.id !== "custom").map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
                <option value="custom">Custom coordinates</option>
              </select>
            </div>
            {showCustomCoords && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={posLat}
                  onChange={(e) => setPosLat(e.target.value)}
                  placeholder="Lat"
                  className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={posLng}
                  onChange={(e) => setPosLng(e.target.value)}
                  placeholder="Lng"
                  className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  disabled={loading}
                />
              </div>
            )}
            {error && (
              <p className="text-[var(--blocked)] text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--teal)] text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-lg"
              style={{ height: "52px" }}
            >
              {loading ? "Verifying…" : "Run verification →"}
            </button>
            <p className="text-[var(--text-muted)] text-xs text-center">
              &lt; 300ms · Live network · Zero-data broker
            </p>
          </form>
        </div>

        {/* Centre panel — 50% */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[400px]">
          {loading && (
            <div className="w-full max-w-md space-y-3">
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Verifying…
              </p>
              <div className="animate-pulse space-y-2">
                {["SIM Swap", "Location Retrieval", "Location Verification", "Device Swap"].map(
                  (label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-sm text-[var(--text-muted)]"
                    >
                      <span>{label}</span>
                      <span>…</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {result && config && !loading && (
            <div className="w-full max-w-lg space-y-6">
              {/* API timings + signal bars */}
              {(apiTimings.length > 0 || totalLatency > 0) && (
                <div className="space-y-2 mb-6">
                  <p className="text-[var(--text-secondary)] text-sm">API latency</p>
                  {apiTimings.map((t) => (
                    <div
                      key={t.api}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[var(--text-secondary)]">
                        ✓ {API_LABELS[t.api] || t.api}
                      </span>
                      <span className="text-[var(--gold)] font-mono">{t.ms}ms</span>
                    </div>
                  ))}
                  <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Total</span>
                    <span className="text-[var(--gold)] font-mono font-semibold">
                      {totalLatency}ms
                    </span>
                  </div>
                </div>
              )}
              {/* API signal bars */}
              <div className="grid grid-cols-4 gap-2">
                {(apiTimings.length > 0 ? apiTimings : [{ api: "sim_swap" }, { api: "location_retrieval" }, { api: "location_verification" }, { api: "device_swap" }]).map((t) => {
                  const apiId = typeof t === "object" && "api" in t ? t.api : String(t);
                  const status = getApiBarStatus(apiId);
                  const bg =
                    status === "clear"
                      ? "var(--approved)"
                      : status === "risk"
                        ? "var(--blocked)"
                        : "var(--escalate)";
                  return (
                    <div key={apiId} className="text-center">
                      <div
                        className="h-2 rounded-full mb-1 transition-all duration-500"
                        style={{
                          backgroundColor: status === "pending" ? "var(--bg-elevated)" : bg,
                          width: "100%",
                        }}
                      />
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {API_LABELS[apiId] || apiId}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Circular gauge */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--bg-elevated)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={
                        result.score >= 70
                          ? "var(--approved)"
                          : result.score >= 40
                            ? "var(--escalate)"
                            : "var(--blocked)"
                      }
                      strokeWidth="10"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * result.score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                    style={{ color: "var(--gold)" }}
                  >
                    {result.score}
                  </span>
                </div>
              </div>

              {/* AI verdict */}
              <div
                className="bg-[var(--navy)] rounded-lg p-4 font-mono text-sm text-[var(--nordic-gray-1)]"
                style={{ minHeight: "80px" }}
              >
                {verdictText}
                <span className="animate-pulse text-[var(--teal-light)]">|</span>
              </div>

              {/* Decision badge */}
              <div className="flex justify-center">
                <span
                  className="inline-block px-8 py-4 rounded-full text-xl font-bold text-white"
                  style={{ backgroundColor: config.bg }}
                >
                  {config.text}
                </span>
              </div>

              {result.suggestBlockCard && result.decision === "deny" && (
                <p className="text-center text-[var(--blocked)] text-sm">
                  ⚠ Suggest processor block this card
                </p>
              )}

              {/* Denial review flow — 2 API calls */}
              {result.decision === "deny" && (denialStatus === "pending" || denialStatus === "resolved") && (
                <div className="mt-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <p className="text-[var(--text-secondary)] text-sm font-medium mb-2">
                    Denial review
                  </p>
                  {denialStatus === "pending" && (
                    <p className="text-[var(--text-muted)] text-sm animate-pulse">
                      Submitting case… polling for resolution…
                    </p>
                  )}
                  {denialStatus === "resolved" && (
                    <p
                      className="text-sm font-semibold"
                      style={{
                        color: denialApproved ? "var(--approved)" : "var(--blocked)",
                      }}
                    >
                      {denialApproved
                        ? "Overturned — approved by review"
                        : "Confirmed — block upheld"}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && !result && (
            <p className="text-[var(--text-muted)]">Run verification to see result</p>
          )}
        </div>

        {/* Right panel — 25% */}
        <div className="w-full lg:w-1/4 bg-[var(--bg-surface)] border-l border-[var(--border)] p-6">
          <h2 className="text-[var(--text-primary)] font-semibold mb-4">
            Escalation brief
          </h2>
          {result && showEscalation ? (
            <div className="space-y-4">
              <p className="text-[var(--text-secondary)] text-sm">
                Score in 30–70 range. Manual review recommended. Customer can be
                contacted via Telegram to confirm transaction.
              </p>
              <div className="flex flex-col gap-2">
                <button className="w-full py-2 rounded-lg border border-[var(--blocked)] text-[var(--blocked)] text-sm font-medium hover:bg-[var(--blocked)]/10">
                  Block
                </button>
                <button className="w-full py-2 rounded-lg border border-[var(--approved)] text-[var(--approved)] text-sm font-medium hover:bg-[var(--approved)]/10">
                  Approve
                </button>
                <button className="w-full py-2 rounded-lg border border-[var(--teal)] text-[var(--teal-light)] text-sm font-medium hover:bg-[var(--teal)]/10">
                  Call customer
                </button>
              </div>
              <p className="text-[var(--text-muted)] text-xs">
                Telegram / Slack integration
              </p>
            </div>
          ) : result ? (
            <p className="text-[var(--text-muted)] text-sm">
              Agent decided autonomously.
            </p>
          ) : (
            <p className="text-[var(--text-muted)] text-sm">
              Result will appear here after verification.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
