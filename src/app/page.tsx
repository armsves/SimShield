import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero — two-column */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-4 leading-tight">
            Every fraud attack starts with a SIM card nobody checked.
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8">
            SimShield verifies the network before the payment fires.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/payment"
              className="inline-flex items-center justify-center bg-[var(--teal)] text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-[#036a76] transition-colors"
            >
              See live demo →
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center border-2 border-[var(--teal)] text-[var(--teal-light)] font-semibold px-6 py-3.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            >
              How it works ↓
            </a>
          </div>
        </div>
        <div className="flex-1 mt-12 lg:mt-0 flex justify-center lg:justify-end">
          <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6 shadow-xl">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-3">
              Fraud score
            </p>
            <div className="relative w-32 h-32 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--bg-elevated)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--teal)"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset="66"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[var(--gold)]">
                75
              </span>
            </div>
            <p className="text-center text-[var(--text-secondary)] text-sm mt-2">
              Confidence score
            </p>
          </div>
        </div>
      </div>

      {/* Business case & stats */}
      <div className="border-t-[3px] border-t-[var(--teal)] bg-[#131D2E]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">
            The business case
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-3xl">
            Physical POS fraud—especially SIM swap attacks—costs retailers millions in chargebacks. 
            SimShield uses live network signals to verify the person at the terminal is the legitimate 
            cardholder <em className="text-[var(--teal-light)]">before</em> payment is authorized.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1A2740] border border-[var(--border)] rounded-lg p-4">
              <p className="text-sm font-semibold text-[var(--teal)] mb-2">Reduce chargebacks</p>
              <p className="text-[var(--text-secondary)] text-sm">
                Block SIM swap fraud and remote attacks before they become chargebacks.
              </p>
            </div>
            <div className="bg-[#1A2740] border border-[var(--border)] rounded-lg p-4">
              <p className="text-sm font-semibold text-[var(--teal)] mb-2">Zero customer friction</p>
              <p className="text-[var(--text-secondary)] text-sm">
                Instant network verification—no extra apps, codes, or delays.
              </p>
            </div>
            <div className="bg-[#1A2740] border border-[var(--border)] rounded-lg p-4">
              <p className="text-sm font-semibold text-[var(--teal)] mb-2">Identity verification</p>
              <p className="text-[var(--text-secondary)] text-sm">
                KYC Match confirms customer data against operator records for high-value transactions.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center pt-6 border-t border-[var(--border)]">
            <div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: "#C8992A" }}>£300M</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">M&S fraud Q1 2025</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: "#C8992A" }}>287ms</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Avg latency per check</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: "#C8992A" }}>97%</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Confidence on blocked cases</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: "#C8992A" }}>5 APIs</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Nokia Network as Code</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works — horizontal timeline */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-12">
          How it works
        </h2>
        <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
          {[
            {
              title: "POS trigger",
              desc: "Merchant captures phone & amount",
              icon: (
                <svg className="w-6 h-6 text-[var(--teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              title: "5 network APIs",
              desc: "Location, SIM swap, device, KYC match",
              icon: (
                <svg className="w-6 h-6 text-[var(--teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              ),
            },
            {
              title: "AI verdict",
              desc: "Real-time risk score & reasoning",
              icon: (
                <svg className="w-6 h-6 text-[var(--teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
            },
            {
              title: "Allow / block",
              desc: "Approve, escalate, or deny",
              icon: (
                <svg className="w-6 h-6 text-[var(--teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((step, i) => (
            <span key={step.title} className="flex md:flex-1 md:min-w-0">
              <div className="flex-1 min-w-0 bg-[#1A2740] border-l-4 border-l-[var(--teal)] rounded-r-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  {step.icon}
                  <p className="font-semibold text-[var(--text-primary)] text-sm">
                    {step.title.toUpperCase()}
                  </p>
                </div>
                <p className="text-[var(--text-secondary)] text-xs">{step.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:flex flex-shrink-0 items-center justify-center px-1">
                  <div className="w-6 h-0.5 bg-[var(--teal)]" />
                  <svg className="w-4 h-4 text-[var(--teal)] -ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* APIs used — card grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-8">
          APIs used
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              name: "Location Retrieval",
              purpose: "Get SIM geolocation from network",
            },
            {
              name: "Location Verification",
              purpose: "Compare SIM location vs POS",
            },
            { name: "SIM Swap", purpose: "Detect recent SIM card change" },
            { name: "Device Swap", purpose: "Detect device change" },
            {
              name: "KYC Match",
              purpose: "Verify identity vs operator records",
            },
          ].map((api) => (
            <div
              key={api.name}
              className="relative bg-[#1A2740] border border-[var(--border)] rounded-lg p-4 group hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <span className="absolute top-2 right-2 text-[10px] font-semibold text-[var(--teal)] uppercase tracking-wider">
                LIVE
              </span>
              <p className="font-bold text-white pr-12">{api.name}</p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{api.purpose}</p>
              <div className="mt-3 w-8 h-1 bg-[var(--teal)] rounded" aria-hidden />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <Link
          href="/payment"
          className="inline-block bg-[var(--teal)] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[#036a76] transition-colors"
        >
          See live demo →
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--teal)] bg-[#0D1321]">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/SimShield-logo.png"
            alt="SimShield"
            width={100}
            height={40}
          />
          <span className="text-[var(--text-muted)] text-sm">
            Powered by <strong className="text-[var(--text-secondary)]">Nokia</strong> NaC
          </span>
          <a
            href="https://talentarena.tech/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--teal-light)] text-sm transition-colors"
          >
            Open Gateway Hackathon 2026
          </a>
        </div>
      </footer>
    </div>
  );
}
