'use client'

import { motion } from 'framer-motion'

const failures = [
  {
    category: 'Hallucination',
    severity: 'high',
    example: 'Agent returned fabricated API data. User filed a support ticket 3 days later.',
    tag: 'SILENT',
  },
  {
    category: 'Infinite loop',
    severity: 'critical',
    example: 'Tool call triggered itself 47 times. $180 burned before rate limit hit.',
    tag: 'COST',
  },
  {
    category: 'Tool call error',
    severity: 'high',
    example: 'External API returned 429. Agent retried 12 times silently. No alert fired.',
    tag: 'SILENT',
  },
  {
    category: 'Context exhaustion',
    severity: 'medium',
    example: 'Prompt hit 128k tokens. Agent silently dropped memory. Output was wrong.',
    tag: 'SILENT',
  },
  {
    category: 'Cost explosion',
    severity: 'critical',
    example: '$340 burned in 8 minutes on one runaway session. Caught on the billing page.',
    tag: 'COST',
  },
  {
    category: 'Goal drift',
    severity: 'medium',
    example: 'Agent completed the wrong subtask. Returned success. No one noticed for a week.',
    tag: 'SILENT',
  },
]

const severityColor: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/25',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
}

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
}

const tagColor: Record<string, string> = {
  SILENT: 'text-white/40 bg-white/[0.05] border-white/[0.10]',
  COST: 'text-red-400/80 bg-red-500/[0.08] border-red-500/20',
}

function PulseDot({ severity }: { severity: string }) {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${severityDot[severity]}`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${severityDot[severity]}`} />
    </span>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export default function WhatBreaks() {
  return (
    <section className="relative py-28 border-t border-white/[0.05]" id="failures">
      <div className="max-w-5xl mx-auto px-6">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-14"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30 mb-5">
            What's actually happening
          </p>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white max-w-xl"
            style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
          >
            Your agent is already broken.
            <br />
            <span className="text-white/40">You just can't see it.</span>
          </h2>
          <p className="mt-5 text-[14px] text-white/40 leading-relaxed max-w-[52ch]">
            These aren't edge cases. They're happening right now, in your production agent, with zero visibility.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.06]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {failures.map((f) => (
            <motion.div
              key={f.category}
              variants={itemVariants}
              className="bg-[#080810] p-6 flex flex-col gap-3 hover:bg-[#0c0c16] transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PulseDot severity={f.severity} />
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${severityColor[f.severity]}`}>
                    {f.severity.toUpperCase()}
                  </span>
                  <span className="text-[13px] font-semibold text-white/90" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                    {f.category}
                  </span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider ${tagColor[f.tag]}`}>
                  {f.tag}
                </span>
              </div>
              <p className="text-[12px] text-white/45 leading-relaxed font-mono border-l-2 border-white/[0.08] pl-3">
                {f.example}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 flex items-center justify-between flex-wrap gap-4"
        >
          <p className="text-[12px] text-white/30">
            Veil detects all 10 failure categories automatically. Zero config.
          </p>
          <span className="text-[11px] font-mono text-red-400/50 tracking-wide">
            6 of 10 failure types shown
          </span>
        </motion.div>

      </div>
    </section>
  )
}
