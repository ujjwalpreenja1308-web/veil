import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Veil",
  description: "How Veil collects, uses, and protects your data.",
};

const sections = [
  {
    id: "overview",
    title: "Overview",
    content: [
      "Veil is an AI agent observability platform. When you use Veil, we collect telemetry data from your AI agents so we can help you detect, classify, and resolve failures faster. This policy explains exactly what we collect, why we collect it, and how we protect it.",
      "We believe privacy is a product quality. We collect the minimum data needed to deliver the product, we never sell it, and we give you full control over deletion.",
    ],
  },
  {
    id: "data-we-collect",
    title: "Data We Collect",
    subsections: [
      {
        heading: "Account Data",
        text: "Your email address, name, and authentication credentials when you sign up. We use Clerk for authentication — your password is never stored by Veil directly.",
      },
      {
        heading: "Agent Telemetry",
        text: "Session events, LLM traces, tool calls, costs, durations, and failure classifications sent by the Veil SDK running inside your agents. This is the core product data.",
      },
      {
        heading: "Usage Data",
        text: "Dashboard interactions, page views, and feature usage patterns. We use this to improve the product. We do not sell this data or share it with ad networks.",
      },
      {
        heading: "Support Communications",
        text: "Messages you send us via email or in-app support. We retain these to resolve your issues and improve the product.",
      },
    ],
  },
  {
    id: "how-we-use-it",
    title: "How We Use Your Data",
    items: [
      "Provide the observability dashboard and alerting features",
      "Detect and classify failures in your agent sessions",
      "Generate Inspector reports and improvement suggestions",
      "Send alerts via Slack, email, or webhook when you configure them",
      "Improve classification accuracy and product features",
      "Respond to support requests",
      "Send product updates (you can unsubscribe at any time)",
    ],
  },
  {
    id: "data-sharing",
    title: "Data Sharing",
    content: [
      "We do not sell your data. Full stop.",
      "We share data only with the following categories of service providers, solely to operate the product:",
    ],
    providers: [
      { name: "Supabase", purpose: "Database and storage" },
      { name: "Clerk", purpose: "Authentication" },
      { name: "Vercel", purpose: "Hosting and edge delivery" },
      { name: "Sentry", purpose: "Error monitoring" },
      { name: "Resend", purpose: "Transactional email" },
    ],
    closing: "Each provider is bound by data processing agreements. Your agent telemetry data is never shared with any third party for their own purposes.",
  },
  {
    id: "tenant-isolation",
    title: "Tenant Isolation and Security",
    content: [
      "Every database query in Veil is scoped by your organization ID. It is architecturally impossible for one customer to access another customer's data through the Veil application layer.",
      "We enforce Row Level Security policies at the database level as an additional defense. Your API keys are hashed before storage and never logged in plaintext.",
      "All data is encrypted in transit (TLS 1.2+) and at rest.",
    ],
  },
  {
    id: "retention",
    title: "Data Retention",
    content: [
      "Agent session data is retained for as long as your account is active. You can delete individual sessions, agents, or your entire organization's data at any time from the dashboard settings.",
      "When you delete your account, we purge all associated data within 30 days. Anonymized, aggregated statistics that cannot be linked back to you may be retained indefinitely.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    items: [
      "Access a copy of all data we hold about you",
      "Correct inaccurate personal data",
      "Delete your account and all associated data",
      "Export your telemetry data in JSON format",
      "Opt out of non-essential communications",
      "Lodge a complaint with your local data protection authority",
    ],
    closing: "To exercise any of these rights, email us at privacy@veilhq.com. We respond within 5 business days.",
  },
  {
    id: "cookies",
    title: "Cookies",
    content: [
      "We use only strictly necessary cookies for authentication session management (via Clerk). We do not use tracking cookies, advertising cookies, or third-party analytics cookies.",
    ],
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: [
      "If we make material changes to this policy, we will notify you by email and display a banner in the dashboard at least 14 days before the changes take effect. The date at the bottom of this page reflects the last update.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-400/4 blur-[100px]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
          >
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors duration-200">
              Veil
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link href="/terms" className="hover:text-white/70 transition-colors duration-200">
              Terms
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all duration-200 text-xs font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-6 animate-[fadeInUp_0.4s_ease_both]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Legal
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 animate-[fadeInUp_0.5s_ease_both]">
          Privacy{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
            Policy
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-2xl animate-[fadeInUp_0.6s_ease_both]">
          We collect the minimum data needed to run the product. We never sell it.
          Here is exactly what we do with your information.
        </p>
        <p className="text-white/25 text-sm mt-4 animate-[fadeInUp_0.7s_ease_both]">
          Last updated April 3, 2025
        </p>
      </header>

      {/* Table of Contents */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 mb-12">
        <div className="rounded-xl border border-white/6 bg-white/[0.02] p-6 animate-[fadeInUp_0.8s_ease_both]">
          <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-4">Contents</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-center gap-2 text-sm text-white/40 hover:text-blue-400 transition-colors duration-200 py-1"
              >
                <span className="text-blue-500/40 font-mono text-xs group-hover:text-blue-400 transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="space-y-16">
          {sections.map((section, idx) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-20 group"
            >
              <div className="flex items-start gap-4 mb-6">
                <span className="mt-1 text-blue-500/40 font-mono text-xs shrink-0 pt-2">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="w-full">
                  <h2 className="text-xl font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                    {section.title}
                  </h2>
                  <div className="mt-1 h-px w-full bg-gradient-to-r from-blue-500/20 to-transparent" />
                </div>
              </div>

              <div className="pl-8 space-y-4">
                {/* Plain paragraphs */}
                {"content" in section &&
                  section.content?.map((para, i) => (
                    <p key={i} className="text-white/60 leading-relaxed text-[15px]">
                      {para}
                    </p>
                  ))}

                {/* Subsections */}
                {"subsections" in section && (
                  <div className="space-y-4 mt-2">
                    {section.subsections?.map((sub) => (
                      <div
                        key={sub.heading}
                        className="rounded-lg border border-white/5 bg-white/[0.015] px-5 py-4 hover:border-blue-500/20 hover:bg-blue-500/5 transition-all duration-300"
                      >
                        <p className="text-sm font-medium text-blue-400 mb-1.5">{sub.heading}</p>
                        <p className="text-white/55 text-[14px] leading-relaxed">{sub.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullet lists */}
                {"items" in section && (
                  <ul className="space-y-2 mt-2">
                    {section.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/60 text-[15px]">
                        <span className="mt-2 w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Providers table */}
                {"providers" in section && (
                  <div className="my-4 rounded-lg border border-white/5 overflow-hidden">
                    {section.providers?.map((p, i) => (
                      <div
                        key={p.name}
                        className={`flex items-center justify-between px-5 py-3 text-[14px] ${
                          i % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"
                        }`}
                      >
                        <span className="font-medium text-white/70">{p.name}</span>
                        <span className="text-white/40">{p.purpose}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Closing text after lists or tables */}
                {"closing" in section && section.closing && (
                  <p className="text-white/60 leading-relaxed text-[15px] mt-4">{section.closing}</p>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-20 rounded-xl border border-blue-500/15 bg-blue-500/5 p-8 text-center">
          <p className="text-white/50 text-sm mb-2">Questions about this policy?</p>
          <a
            href="mailto:privacy@veilhq.com"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
          >
            privacy@veilhq.com
          </a>
        </div>

        {/* Bottom nav */}
        <div className="mt-12 flex items-center justify-between text-sm text-white/25">
          <Link href="/" className="hover:text-white/50 transition-colors duration-200">
            Back to Veil
          </Link>
          <Link href="/terms" className="hover:text-white/50 transition-colors duration-200">
            Terms of Service
          </Link>
        </div>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
