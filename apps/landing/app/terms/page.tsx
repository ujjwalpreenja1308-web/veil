import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Veil',
  description: 'The terms that govern your use of Veil.',
};

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: [
      'By creating a Veil account or using the Veil SDK, you agree to these Terms of Service. If you are using Veil on behalf of an organization, you represent that you have the authority to bind that organization to these terms.',
      'These terms form a legally binding agreement between you (or your organization) and Veil. If you do not agree, do not use the service.',
    ],
  },
  {
    id: 'description',
    title: 'What Veil Is',
    content: [
      'Veil is an AI agent observability platform. You integrate the Veil SDK into your AI agents. The SDK sends telemetry to Veil\'s servers. Veil processes that telemetry to detect failures, classify root causes, generate suggestions, and trigger alerts.',
      'We provide a dashboard, an API, and a set of integrations (Slack, GitHub, webhooks) as the interface to that analysis.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts and Access',
    items: [
      'You must provide accurate information when creating your account',
      'You are responsible for maintaining the security of your API keys and account credentials',
      'You must notify us immediately if you believe your API key has been compromised',
      'You may not share your account with others or create accounts on behalf of someone else without authorization',
      'We reserve the right to suspend accounts that show signs of abuse or security risk',
    ],
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    content: [
      'Veil is built for legitimate observability use cases. You agree not to use Veil to:',
    ],
    prohibited: [
      'Transmit data you do not have the right to send',
      'Attempt to access data belonging to other Veil customers',
      'Send payloads designed to exploit vulnerabilities in Veil\'s ingestion pipeline',
      'Generate artificial load to degrade service quality for other users',
      'Reverse engineer or attempt to extract Veil\'s proprietary classification models',
      'Resell or sublicense access to the Veil platform without a written reseller agreement',
    ],
    closing: 'Violating these rules may result in immediate account suspension without refund.',
  },
  {
    id: 'your-data',
    title: 'Your Data',
    content: [
      'You retain ownership of all telemetry data, session data, and agent data you send to Veil. You grant Veil a limited license to process and store that data solely to provide the service to you.',
      'We do not use your agent telemetry to train models, build benchmarks, or serve any purpose other than running the product for your account.',
      'You can delete your data at any time. See our Privacy Policy for retention details.',
    ],
  },
  {
    id: 'billing',
    title: 'Billing and Payment',
    content: [
      'Paid plans are billed monthly or annually, depending on your selection. All prices are in USD unless stated otherwise.',
      'If your payment fails, we will retry for up to 7 days before downgrading your account to the free tier. You will not lose your data during this grace period.',
      'Refunds are available within 14 days of any annual plan purchase if you have not used the features in that period. Monthly plans are non-refundable.',
    ],
  },
  {
    id: 'availability',
    title: 'Service Availability',
    content: [
      'We target 99.9% uptime for the Veil dashboard and ingest API. Planned maintenance will be announced at least 24 hours in advance.',
      'The Veil SDK is designed to be fire-and-forget: it will not throw errors or block your agent if the Veil ingest API is unavailable. Your agent operations are not dependent on Veil\'s availability.',
    ],
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    content: [
      'Veil, its classification engine, Inspector models, and all related software are owned by Veil and protected by intellectual property laws. Nothing in these terms transfers any ownership to you.',
      'We grant you a non-exclusive, non-transferable license to use the Veil SDK under the terms of its open-source license (MIT). The Veil platform itself is proprietary.',
    ],
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: [
      'Veil is provided as-is. To the maximum extent permitted by law, Veil is not liable for indirect, incidental, or consequential damages arising from your use of the service, including but not limited to lost profits, lost data, or business interruption.',
      "Veil's total liability for any claim arising from these terms is limited to the amount you paid us in the 12 months preceding the claim.",
      'Some jurisdictions do not allow limitation of liability for certain damages. In those jurisdictions, our liability is limited to the greatest extent permitted by law.',
    ],
  },
  {
    id: 'termination',
    title: 'Termination',
    content: [
      'You can cancel your account at any time from dashboard settings. Cancellation takes effect at the end of the current billing period.',
      'We may terminate or suspend your account for material violations of these terms, with or without notice depending on the severity of the violation.',
      'Upon termination, your right to use Veil ceases. We will retain your data for 30 days after termination to allow export, then delete it.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    content: [
      'We may update these terms from time to time. For material changes, we will notify you by email at least 14 days before the new terms take effect. Your continued use after that date constitutes acceptance.',
      'The date at the bottom of this page reflects the last revision.',
    ],
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: [
      'These terms are governed by the laws of the State of Delaware, without regard to conflict of law provisions. Any disputes arising from these terms will be resolved in the state or federal courts of Delaware.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-400/4 blur-[100px]" />
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
            <Link href="/privacy" className="text-[13px] text-white/35 hover:text-white/60 transition-colors duration-200">
              Privacy
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
          Terms of{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300">
            Service
          </span>
        </h1>
        <p
          className="text-white/45 text-lg max-w-2xl leading-relaxed"
          style={{ animation: 'fadeInUp 0.6s ease both' }}
        >
          Plain language terms for using Veil. No hidden gotchas.
          Read the full text below or jump to any section.
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

                {'prohibited' in section && (
                  <ul className="space-y-2 mt-2">
                    {section.prohibited?.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-white/55 text-[14.5px] rounded-lg px-4 py-2.5 border border-white/[0.04] bg-white/[0.01] hover:border-red-500/15 hover:bg-red-500/[0.04] transition-all duration-200"
                      >
                        <span className="mt-[9px] w-1 h-1 rounded-full bg-red-400/50 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
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
          <p className="text-white/40 text-[13px] mb-2">Questions about these terms?</p>
          <a
            href="mailto:legal@veilhq.com"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 text-[15px]"
          >
            legal@veilhq.com
          </a>
        </div>

        {/* Bottom nav */}
        <div className="mt-10 flex items-center justify-between text-[12px] text-white/20">
          <Link href="/" className="hover:text-white/45 transition-colors duration-200">
            Back to Veil
          </Link>
          <Link href="/privacy" className="hover:text-white/45 transition-colors duration-200">
            Privacy Policy
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
