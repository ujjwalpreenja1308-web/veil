import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Veil',
  description: 'How Veil collects, uses, and protects your data.',
};

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    content: [
      'Veil is an AI agent observability platform. When you use Veil, we collect telemetry data from your AI agents so we can help you detect, classify, and resolve failures faster. This policy explains exactly what we collect, why we collect it, and how we protect it.',
      'We believe privacy is a product quality. We collect the minimum data needed to deliver the product, we never sell it, and we give you full control over deletion.',
    ],
  },
  {
    id: 'data-we-collect',
    title: 'Data We Collect',
    subsections: [
      {
        heading: 'Account Data',
        text: 'Your email address, name, and authentication credentials when you sign up. We use Clerk for authentication — your password is never stored by Veil directly.',
      },
      {
        heading: 'Agent Telemetry',
        text: 'Session events, LLM traces, tool calls, costs, durations, and failure classifications sent by the Veil SDK running inside your agents. This is the core product data.',
      },
      {
        heading: 'Usage Data',
        text: 'Dashboard interactions, page views, and feature usage patterns. We use this to improve the product. We do not sell this data or share it with ad networks.',
      },
      {
        heading: 'Support Communications',
        text: 'Messages you send us via email or in-app support. We retain these to resolve your issues and improve the product.',
      },
    ],
  },
  {
    id: 'how-we-use-it',
    title: 'How We Use Your Data',
    items: [
      'Provide the observability dashboard and alerting features',
      'Detect and classify failures in your agent sessions',
      'Generate Inspector reports and improvement suggestions',
      'Send alerts via Slack, email, or webhook when you configure them',
      'Improve classification accuracy and product features',
      'Respond to support requests',
      'Send product updates (you can unsubscribe at any time)',
    ],
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    content: [
      'We do not sell your data. Full stop.',
      'We share data only with the following service providers, solely to operate the product:',
    ],
    providers: [
      { name: 'Supabase', purpose: 'Database and storage' },
      { name: 'Clerk', purpose: 'Authentication' },
      { name: 'Vercel', purpose: 'Hosting and edge delivery' },
      { name: 'Sentry', purpose: 'Error monitoring' },
      { name: 'Resend', purpose: 'Transactional email' },
    ],
    closing:
      'Each provider is bound by data processing agreements. Your agent telemetry data is never shared with any third party for their own purposes.',
  },
  {
    id: 'tenant-isolation',
    title: 'Tenant Isolation and Security',
    content: [
      'Every database query in Veil is scoped by your organization ID. It is architecturally impossible for one customer to access another customer\'s data through the Veil application layer.',
      'We enforce Row Level Security policies at the database level as an additional defense. Your API keys are hashed before storage and never logged in plaintext.',
      'All data is encrypted in transit (TLS 1.2+) and at rest.',
    ],
  },
  {
    id: 'retention',
    title: 'Data Retention',
    content: [
      'Agent session data is retained for as long as your account is active. You can delete individual sessions, agents, or your entire organization\'s data at any time from the dashboard settings.',
      'When you delete your account, we purge all associated data within 30 days. Anonymized, aggregated statistics that cannot be linked back to you may be retained indefinitely.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    items: [
      'Access a copy of all data we hold about you',
      'Correct inaccurate personal data',
      'Delete your account and all associated data',
      'Export your telemetry data in JSON format',
      'Opt out of non-essential communications',
      'Lodge a complaint with your local data protection authority',
    ],
    closing: 'To exercise any of these rights, email us at privacy@veilhq.com. We respond within 5 business days.',
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: [
      'We use only strictly necessary cookies for authentication session management. We do not use tracking cookies, advertising cookies, or third-party analytics cookies.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: [
      'If we make material changes to this policy, we will notify you by email and display a banner in the dashboard at least 14 days before the changes take effect. The date at the bottom of this page reflects the last update.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-400/4 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/[0.05] backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <img src="/logo.svg" alt="Veil" className="w-5 h-5" />
            <span className="text-[15px] font-semibold tracking-tight text-white/80 group-hover:text-white transition-colors duration-200">
              Veil
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-[13px] text-white/35 hover:text-white/60 transition-colors duration-200">
              Terms
            </Link>
            <Link
              href="https://app.veilhq.com/sign-up"
              className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all duration-200 text-xs font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-12">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-medium mb-6"
          style={{ animation: 'fadeInUp 0.4s ease both' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Legal
        </div>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          style={{ animation: 'fadeInUp 0.5s ease both', fontFamily: 'Geist, sans-serif' }}
        >
          Privacy{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
            Policy
          </span>
        </h1>
        <p
          className="text-white/45 text-lg max-w-2xl leading-relaxed"
          style={{ animation: 'fadeInUp 0.6s ease both' }}
        >
          We collect the minimum data needed to run the product. We never sell it.
          Here is exactly what we do with your information.
        </p>
        <p className="text-white/20 text-sm mt-4" style={{ animation: 'fadeInUp 0.7s ease both' }}>
          Last updated April 3, 2025
        </p>
      </header>

      {/* Table of contents */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 mb-12" style={{ animation: 'fadeInUp 0.8s ease both' }}>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-4">Contents</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-center gap-2 text-[13px] text-white/35 hover:text-blue-400 transition-colors duration-200 py-1"
              >
                <span className="text-blue-500/35 font-mono text-[11px] group-hover:text-blue-400 transition-colors shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="space-y-16">
          {sections.map((section, idx) => (
            <section key={section.id} id={section.id} className="scroll-mt-20 group">
              <div className="flex items-start gap-4 mb-6">
                <span className="text-blue-500/35 font-mono text-[11px] shrink-0 pt-[11px]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="w-full">
                  <h2 className="text-[18px] font-semibold text-white/90 group-hover:text-white transition-colors duration-300">
                    {section.title}
                  </h2>
                  <div className="mt-1.5 h-px w-full bg-gradient-to-r from-blue-500/25 to-transparent" />
                </div>
              </div>

              <div className="pl-8 space-y-4">
                {'content' in section &&
                  section.content?.map((para, i) => (
                    <p key={i} className="text-white/55 leading-relaxed text-[14.5px]">
                      {para}
                    </p>
                  ))}

                {'subsections' in section && (
                  <div className="space-y-3 mt-2">
                    {section.subsections?.map((sub) => (
                      <div
                        key={sub.heading}
                        className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-5 py-4 hover:border-blue-500/20 hover:bg-blue-500/[0.04] transition-all duration-300"
                      >
                        <p className="text-[13px] font-medium text-blue-400 mb-1.5">{sub.heading}</p>
                        <p className="text-white/50 text-[13.5px] leading-relaxed">{sub.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {'items' in section && (
                  <ul className="space-y-2 mt-2">
                    {section.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/55 text-[14.5px]">
                        <span className="mt-[9px] w-1 h-1 rounded-full bg-blue-400/70 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {'providers' in section && (
                  <div className="my-4 rounded-lg border border-white/[0.05] overflow-hidden">
                    {section.providers?.map((p, i) => (
                      <div
                        key={p.name}
                        className={`flex items-center justify-between px-5 py-3 text-[13.5px] ${
                          i % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent'
                        }`}
                      >
                        <span className="font-medium text-white/65">{p.name}</span>
                        <span className="text-white/35">{p.purpose}</span>
                      </div>
                    ))}
                  </div>
                )}

                {'closing' in section && section.closing && (
                  <p className="text-white/55 leading-relaxed text-[14.5px] mt-4">{section.closing}</p>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-8 text-center">
          <p className="text-white/40 text-[13px] mb-2">Questions about this policy?</p>
          <a
            href="mailto:privacy@veilhq.com"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 text-[15px]"
          >
            privacy@veilhq.com
          </a>
        </div>

        {/* Bottom nav */}
        <div className="mt-10 flex items-center justify-between text-[12px] text-white/20">
          <Link href="/" className="hover:text-white/45 transition-colors duration-200">
            Back to Veil
          </Link>
          <Link href="/terms" className="hover:text-white/45 transition-colors duration-200">
            Terms of Service
          </Link>
        </div>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
