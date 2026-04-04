'use client'

import { motion } from 'framer-motion'

export default function HowItWorks() {
  return (
    <section className="relative py-32 border-t border-white/[0.05]" id="how-it-works">
      <div className="max-w-5xl mx-auto px-6">

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-start">

          {/* Left — dramatic copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/25 mb-5">
              Setup
            </p>
            <h2
              className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white mb-6"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              Add one line
              <br />
              <span className="text-white/35 font-semibold">See every failure<br />your agent has ever made</span>
            </h2>
            <p className="text-[13px] text-white/30 leading-relaxed max-w-[38ch] mb-8">
              No infra. No pipelines. No config files. Works with LangChain, CrewAI,
              AutoGen, or any Python agent. Running in under 60 seconds.
            </p>
            <div className="flex flex-col gap-2">
              {['Zero latency impact, async and fire-and-forget', 'All 10 failure types classified automatically', 'Slack and email alerts with failure context attached'].map((point, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12px] text-white/35">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="rgba(59,130,246,0.5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {point}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — code */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col gap-4"
          >
            {/* Step 1 */}
            <div>
              <p className="text-[10px] font-mono text-white/20 mb-2 tracking-wider">01  install</p>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: '#0b0b14',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.05]">
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="ml-2 text-[10px] font-mono text-white/15">bash</span>
                </div>
                <pre className="px-5 py-4 font-mono text-[12px] leading-relaxed">
                  <code>
                    <span className="text-white/20">$ </span>
                    <span className="text-blue-300/80">pip install veil-sdk</span>
                  </code>
                </pre>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <p className="text-[10px] font-mono text-white/20 mb-2 tracking-wider">02  init your agent</p>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: '#0b0b14',
                  border: '1px solid rgba(59,130,246,0.12)',
                  boxShadow: 'inset 0 1px 0 rgba(59,130,246,0.06)',
                }}
              >
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.05]">
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="ml-2 text-[10px] font-mono text-white/15">python</span>
                </div>
                <pre className="px-5 py-4 font-mono text-[12px] leading-relaxed">
                  <code>
                    <span className="text-white/30">import </span>
                    <span className="text-blue-300/80">veil{'\n'}</span>
                    <span className="text-blue-300/80">veil</span>
                    <span className="text-white/30">.init(</span>
                    <span className="text-white/50">api_key</span>
                    <span className="text-white/30">=</span>
                    <span className="text-blue-200/60">"vl_..."</span>
                    <span className="text-white/30">)</span>
                    <span className="text-white/20">  # that's it</span>
                  </code>
                </pre>
              </div>
            </div>

            {/* Step 3 — result */}
            <div
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{
                background: '#0b0b14',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <p className="text-[10px] font-mono text-white/20 tracking-wider">03  live in dashboard</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Traces flowing', status: 'live' },
                  { label: 'Failures classified', status: 'live' },
                  { label: 'Alerts configured', status: 'ready' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-white/40 font-mono">{row.label}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 animate-pulse" />
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
