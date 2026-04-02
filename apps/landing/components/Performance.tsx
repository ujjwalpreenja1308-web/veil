'use client'

import { motion } from 'framer-motion'

const stats = [
  {
    value: '3.1ms',
    label: 'Avg overhead',
    detail: 'Measured across 10,000+ real production agent runs.',
    accent: false,
  },
  {
    value: '0',
    label: 'Blocked threads',
    detail: 'All telemetry is async. Your agent thread is never touched.',
    accent: false,
  },
  {
    value: '100%',
    label: 'Fire-and-forget',
    detail: 'Data ships out of band. Your agent never waits for observability.',
    accent: true,
  },
]

export default function Performance() {
  return (
    <section className="relative py-32 border-t border-white/[0.05]" id="performance">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">

        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-16 md:gap-24 items-start">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30 mb-5">
              Performance
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white mb-6" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
              Invisible
              <br />
              <span className="text-white/40">by design</span>
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-[40ch] mb-8">
              Veil is built on OpenTelemetry. All collection is async and non-blocking.
              Your agent never waits for observability.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70 animate-pulse" />
              <span className="text-[11px] font-mono text-blue-400/70 tracking-wide">Zero-interference guarantee</span>
            </div>
          </motion.div>

          {/* Right — stat rows */}
          <div className="flex flex-col divide-y divide-white/[0.06]">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.1 }}
                className="group flex items-baseline gap-8 py-8 first:pt-0"
              >
                <span className={`font-mono text-[2.8rem] font-bold tracking-[-0.04em] tabular-nums leading-none w-32 shrink-0 ${stat.accent ? 'text-white' : 'text-white/90'}`}>
                  {stat.value}
                </span>
                <div>
                  <div className="text-[14px] font-semibold text-white/80 mb-1 tracking-tight">{stat.label}</div>
                  <div className="text-[12px] text-white/40 leading-relaxed">{stat.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
        >
          <p className="text-[12px] text-white/30 leading-relaxed max-w-[55ch]">
            Built on OpenTelemetry, the industry standard for distributed tracing,
            with a purpose-built layer for AI agent observability.
          </p>
          <span className="shrink-0 text-[10px] font-mono font-medium tracking-[0.2em] text-white/25 uppercase">
            OpenTelemetry compatible
          </span>
        </motion.div>
      </div>
    </section>
  )
}
