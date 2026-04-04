'use client'

import { motion } from 'framer-motion'

const capabilities = [
  {
    number: '01',
    title: 'Real-time traces',
    description: 'Every execution step logged with millisecond timing. See exactly what your agent did and when.',
  },
  {
    number: '02',
    title: 'Failure classification',
    description: 'Context exhaustion, infinite loops, hallucinations, RAG failures — classified automatically, not guessed.',
  },
  {
    number: '03',
    title: 'Pattern detection',
    description: 'Surface recurring failure signatures across hundreds of runs before they become incidents.',
  },
  {
    number: '04',
    title: 'Cost per run',
    description: 'Token consumption and API spend broken down by step. Know exactly where money goes.',
  },
]

const inView = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.09 },
  }),
}

export default function WhatItDoes() {
  return (
    <section className="relative py-32 overflow-hidden" id="features">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16">

        {/* Left-aligned section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-20 max-w-xl"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/25 mb-5">
            Capabilities
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white mb-5">
            Full visibility into
            <br />
            <span className="text-white/40 font-semibold">every agent execution.</span>
          </h2>
          <p className="text-sm text-white/35 leading-relaxed max-w-[42ch]">
            Veil connects to your agent and gives you structured observability — no pipelines, no config, no guessing.
          </p>
        </motion.div>

        {/* Asymmetric 2-col zig-zag grid — not 4 equal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.05]">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.number}
              custom={i}
              variants={inView}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group relative bg-[#080810] p-10 hover:bg-[#0d0d18] transition-colors duration-300"
            >
              {/* Number — large, faint, top-right */}
              <span
                className="absolute top-8 right-8 font-mono text-[11px] tracking-widest text-white/12 font-semibold select-none"
              >
                {cap.number}
              </span>

              {/* Hover accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/0 group-hover:bg-blue-500/30 transition-colors duration-500" />

              <h3 className="text-white font-semibold text-lg tracking-tight mb-3">{cap.title}</h3>
              <p className="text-white/35 text-sm leading-relaxed max-w-[38ch]">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
