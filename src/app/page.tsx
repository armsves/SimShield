import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      {/* Hero */}
      <div className="px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          SimShield
        </h1>
        <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto mb-2">
          Physical payment validation powered by network APIs
        </p>
        <p className="text-[#64748b] text-sm mb-12">
          Open Gateway Hackathon 2026 · Nokia Network as Code
        </p>

        <Link
          href="/payment"
          className="inline-block bg-[#1e293b] text-white font-semibold px-8 py-4 rounded-lg border border-[#334155] hover:bg-[#334155] transition-colors"
        >
          Process payment →
        </Link>
      </div>

      {/* How it works */}
      <div className="px-4 max-w-3xl mx-auto py-12 border-t border-[#1e293b]">
        <h2 className="text-xl font-bold text-white mb-6">How it works</h2>
        <div className="space-y-6 text-[#94a3b8]">
          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-sm font-bold">
              1
            </span>
            <div>
              <p className="font-medium text-white">Customer at POS</p>
              <p className="text-sm">
                The merchant captures the customer&apos;s phone number and transaction
                amount at the point of sale.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-sm font-bold">
              2
            </span>
            <div>
              <p className="font-medium text-white">Network validation</p>
              <p className="text-sm">
                SimShield calls Nokia&apos;s Network as Code APIs: Location Retrieval,
                Location Verification, SIM Swap, and Device Swap. We compare the
                customer&apos;s SIM location with the POS to detect remote fraud.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-sm font-bold">
              3
            </span>
            <div>
              <p className="font-medium text-white">Risk score & decision</p>
              <p className="text-sm">
                A custom score determines the outcome: <strong className="text-green-400">Approve</strong> to process
                payment, <strong className="text-amber-400">Clarify</strong> via Telegram chatbot, or{" "}
                <strong className="text-red-400">Deny</strong> and optionally suggest blocking the card.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* APIs used */}
      <div className="px-4 max-w-3xl mx-auto py-12 border-t border-[#1e293b]">
        <h2 className="text-xl font-bold text-white mb-4">APIs used</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Location Retrieval",
            "Location Verification",
            "SIM Swap",
            "Device Swap",
          ].map((api) => (
            <div
              key={api}
              className="bg-[#0f172a] border border-[#1e293b] rounded-lg px-4 py-3 text-[#94a3b8] text-sm"
            >
              {api}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-12 text-center border-t border-[#1e293b]">
        <Link
          href="/payment"
          className="inline-block bg-[#1e293b] text-white font-semibold px-8 py-3 rounded-lg border border-[#334155] hover:bg-[#334155] transition-colors"
        >
          Go to payment →
        </Link>
      </div>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-xs text-[#64748b]">
        Powered by Nokia Network as Code ·{" "}
        <a
          href="https://talentarena.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-white transition-colors"
        >
          Talent Arena 2026
        </a>
      </footer>
    </div>
  );
}
