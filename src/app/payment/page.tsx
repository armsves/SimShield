"use client";

import { useState } from "react";
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

export default function SimShieldPOS() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [posLat, setPosLat] = useState("");
  const [posLng, setPosLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosLat(pos.coords.latitude.toFixed(15));
          setPosLng(pos.coords.longitude.toFixed(15));
          setSelectedStoreId("custom");
        },
        () => setError("Could not get POS location")
      );
    } else {
      setError("Geolocation not supported");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const lat = parseFloat(posLat);
    const lng = parseFloat(posLng);
    const amountCents = Math.round(parseFloat(amount || "0") * 100);

    if (!phoneNumber || isNaN(lat) || isNaN(lng) || amountCents <= 0) {
      setError("Please fill phone, amount, and select or enter a store location");
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
        return {
          bg: "bg-[#0d8a3c]",
          factorBg: "bg-[#0a6b2e]",
          text: "APPROVED",
          desc: "Process payment",
        };
      case "deny":
        return {
          bg: "bg-[#e00000]",
          factorBg: "bg-[#b30000]",
          text: "DENIED",
          desc: "Reject transaction",
        };
      case "clarify":
        return {
          bg: "bg-[#e69500]",
          factorBg: "bg-[#b87600]",
          text: "CLARIFY",
          desc: "Contact customer via Telegram",
        };
      default:
        return null;
    }
  };

  const config = result ? getDecisionConfig() : null;
  const showCustomCoords = selectedStoreId === "custom" || !selectedStoreId;

  return (
    <div className="min-h-screen bg-[#0a0e14] flex flex-col items-center py-12 px-4 font-sans">
      <div className="text-center mb-8">
        <Link
          href="/"
          className="text-slate-500 hover:text-white text-sm mb-4 inline-block"
        >
          ← Back to home
        </Link>
        <Image
          src="/SimShield-logo.png"
          alt="SimShield"
          width={140}
          height={56}
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-white tracking-tight">
          SimShield POS
        </h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          Payment validation via network APIs
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#0f172a] rounded-xl shadow-xl p-6 w-full max-w-md mb-6 border border-[#1e293b]"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Customer phone
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+34640030004"
            className="w-full border border-[#334155] rounded-md px-3 py-2.5 bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Amount (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            className="w-full border border-[#334155] rounded-md px-3 py-2.5 bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Store / POS location
          </label>
          <select
            value={selectedStoreId}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="w-full border border-[#334155] rounded-md px-3 py-2.5 bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select a store…</option>
            {STORES.filter((s) => s.id !== "custom").map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} · {store.address}
              </option>
            ))}
            <option value="custom">Use custom coordinates</option>
          </select>
        </div>

        {showCustomCoords && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Coordinates (if custom)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={posLat}
                onChange={(e) => setPosLat(e.target.value)}
                placeholder="Latitude"
                className="flex-1 min-w-0 border border-[#334155] rounded-md px-3 py-2.5 bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm"
                disabled={loading}
              />
              <input
                type="text"
                value={posLng}
                onChange={(e) => setPosLng(e.target.value)}
                placeholder="Longitude"
                className="flex-1 min-w-0 border border-[#334155] rounded-md px-3 py-2.5 bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleGeoLocation}
                disabled={loading}
                className="flex-shrink-0 bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2.5 flex items-center justify-center hover:bg-[#334155] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-red-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.54 22.351l.07.04.028.016a.76.76 0 00.724 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {selectedStoreId && selectedStoreId !== "custom" && (
          <p className="text-xs text-slate-500 mb-6">
            {STORES.find((s) => s.id === selectedStoreId)?.address} ·{" "}
            {posLat && posLng ? `${posLat.slice(0, 10)}, ${posLng.slice(0, 10)}` : ""}
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-red-500/20 border border-red-500/50 px-4 py-2 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1e293b] text-white font-semibold py-3 px-4 rounded-md hover:bg-[#334155] transition-colors shadow-sm border border-[#334155] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Validating…" : "Validate payment"}
        </button>
      </form>

      {result && config && (
        <div
          className={`${config.bg} text-white rounded-xl shadow-xl p-6 w-full max-w-md text-center`}
        >
          <h2 className="text-3xl font-bold tracking-wide mb-1">{config.text}</h2>
          <p className="text-lg font-medium mb-1 opacity-95">{config.desc}</p>
          <p className="text-sm opacity-90 mb-4">Final score: {result.score}/100</p>

          {/* Score breakdown */}
          <div className="mb-6 text-left bg-black/20 rounded-md px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide mb-2 opacity-80">
              Score breakdown
            </p>
            <p className="text-xs opacity-75 mb-2">Base: 50</p>
            {result.factors.map((f) => (
              <div
                key={f.name}
                className="flex justify-between items-start gap-2 text-xs opacity-90"
              >
                <span className="flex-1 min-w-0">{f.description}</span>
                <span
                  className={
                    (f.points ?? 0) >= 0
                      ? "text-green-200 font-mono flex-shrink-0"
                      : "text-red-200 font-mono flex-shrink-0"
                  }
                >
                  {f.points !== undefined && f.points >= 0 ? "+" : ""}
                  {f.points}
                </span>
              </div>
            ))}
          </div>

          {result.suggestBlockCard && result.decision === "deny" && (
            <div className="mb-4 flex items-center justify-center gap-2 bg-black/20 rounded-md px-4 py-2 text-sm">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Suggest processor block this card
            </div>
          )}

          {result.decision === "clarify" && (
            <p className="mb-4 rounded-md bg-black/20 px-4 py-2 text-sm">
              → Trigger Telegram LLM chatbot to contact customer
            </p>
          )}

          {result.factors.length > 0 && (
            <div className="text-left">
              <p className="text-sm font-medium mb-2 opacity-90">Factors:</p>
              <div className="flex flex-col gap-2">
                {result.factors.map((f) => (
                  <div
                    key={f.name}
                    className={`${config.factorBg} rounded-md px-4 py-2 text-sm flex justify-between items-center gap-3`}
                  >
                    <span>{f.description}</span>
                    {f.points !== undefined && (
                      <span className="font-mono text-sm opacity-90 whitespace-nowrap">
                        {f.points >= 0 ? "+" : ""}
                        {f.points}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-xs text-slate-500 text-center">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors">
          ← Back to SimShield
        </Link>
      </div>
    </div>
  );
}
