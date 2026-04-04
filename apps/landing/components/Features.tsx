'use client'

import { motion } from 'framer-motion'

// Zig-zag 2-col layout — NOT 3 equal columns
const rows = [
  {
    left: {
      title: 'Live execution traces',
      description: 'Every LLM call, tool invocation, and decision logged in structured order. Replay any run step by step.',
      tag: 'Monitoring',
    },
    right: {
      title: 'Smart alerting',
      description: 'Get notified on Slack or email the moment something breaks — with the failure category already classified.',
      tag: 'Alerts',
    },
  },
  {
    left: {
      title: '10 built-in failure rules',
      description: 'Loops, hallucinations, context exhaustion, prompt injection, RAG failure, cost anomalies — all covered out of the box.',
      tag: 'Classification',
    },
    right: {
      title: 'Works anywhere',
      description: 'Python agents, n8n workflows, Zapier automations, webhooks. Any stack, identical behavior.',
      tag: 'Compatibility',
    },
  },
  {
    left: {
      title: 'Cost breakdown per run',
      description: 'Token consumption, API spend, and per-step cost attribution. Know where every dollar goes.',
      tag: 'Cost',
    },
    right: {
      title: 'Pattern detection',
      description: 'Veil clusters similar failures across runs and surfaces recurring signatures before they become incidents.',
      tag: 'Intelligence',
    },
  },
]

export default function Features() {
  return (
    <section className="relative py-32 border-t border-white/[0.05]" id="capabilities">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-20 max-w-lg"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/25 mb-5">
            What you get
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white">
            Built to ship
            <br />
            <span className="text-white/40 font-semibold">reliable agents.</span>
          </h2>
        </motion.div>

        {/* Zig-zag rows */}
        <div className="flex flex-col gap-px bg-white/[0.04]">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04]">
              {[row.left, row.right].map((item, ci) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: ci * 0.08 }}
                  className="group bg-[#080810] hover:bg-[#0d0d18] transition-colors duration-300 p-10 flex flex-col justify-between gap-8 min-h-[200px]"
                >
                  <div>
                    <span className="inline-block text-[10px] font-mono font-medium tracking-[0.18em] text-white/20 uppercase mb-4">
                      {item.tag}
                    </span>
                    <h3 className="text-white font-semibold text-[1.05rem] tracking-tight mb-3 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-white/35 text-sm leading-relaxed max-w-[38ch]">
                      {item.description}
                    </p>
                  </div>
                  {/* Understated arrow — appears on hover */}
                  <div className="flex items-center gap-2 text-white/0 group-hover:text-white/25 transition-colors duration-300">
                    <div className="h-px w-6 bg-current" />
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
