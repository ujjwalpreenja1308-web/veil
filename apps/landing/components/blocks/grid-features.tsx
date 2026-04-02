'use client';

import { Activity, AlertTriangle, BarChart3, Repeat2, ShieldCheck, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const features = [
  {
    title: 'Live execution traces',
    icon: Activity,
    description: 'Every LLM call, tool invocation, and decision logged with millisecond timing. Replay any run step by step.',
  },
  {
    title: 'Failure classification',
    icon: AlertTriangle,
    description: 'Context exhaustion, loops, hallucinations, RAG failures. Classified across 10 built-in rules automatically.',
  },
  {
    title: 'Cost per run',
    icon: BarChart3,
    description: 'Token spend and API cost broken down by step. Know exactly where every dollar goes.',
  },
  {
    title: 'Pattern detection',
    icon: Repeat2,
    description: 'Recurring failure signatures clustered across hundreds of runs before they become incidents.',
  },
  {
    title: 'Smart alerting',
    icon: ShieldCheck,
    description: 'Slack or email alerts the moment something breaks, with the failure category already attached.',
  },
  {
    title: '< 5ms overhead',
    icon: Zap,
    description: 'All telemetry is async and fire-and-forget. Your agent thread never waits for observability.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400/60" />
    </span>
  )
}

export function GridFeatures() {
  const shouldReduceMotion = useReducedMotion();
  const HeroIcon = features[0].icon;
  const ClassifyIcon = features[1].icon;

  return (
    <section className="py-20 md:py-32 border-t border-white/[0.05]" id="capabilities">
      <div className="mx-auto w-full max-w-5xl px-6">

        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/25 mb-5">
            What you get
          </p>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.08] tracking-[-0.03em] text-white max-w-lg"
            style={{ fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 600 }}
          >
            Every tool you need to ship
            <br />
            <span className="text-white/35 font-semibold">agents that don't fail silently.</span>
          </h2>
        </motion.div>

        {/* Asymmetric bento: 2 large + 4 small */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-px bg-white/[0.05]"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Large feature — col 1, row 1-2 */}
          <motion.div
            variants={shouldReduceMotion ? {} : itemVariants}
            className="bg-[#080810] p-8 flex flex-col gap-5 md:row-span-2"
          >
            <div className="flex items-center justify-between">
              <HeroIcon className="text-white/50 size-5" strokeWidth={1.2} aria-hidden />
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/20">
                <LiveDot />
                live
              </div>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white/85 mb-2" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                {features[0].title}
              </h3>
              <p className="text-[12px] text-white/30 leading-relaxed">{features[0].description}</p>
            </div>
            {/* Mini trace visualization */}
            <div className="mt-auto flex flex-col gap-1.5">
              {[
                { label: 'llm.call', ms: '312ms', color: 'bg-blue-400/40' },
                { label: 'tool.search', ms: '89ms', color: 'bg-white/20' },
                { label: 'llm.call', ms: '428ms', color: 'bg-blue-400/40' },
                { label: 'tool.write', ms: '23ms', color: 'bg-white/20' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/20 w-20 flex-shrink-0">{row.label}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${row.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${[72, 22, 100, 8][i]}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-white/20 w-10 text-right flex-shrink-0">{row.ms}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Large feature — col 2, row 1 */}
          <motion.div
            variants={shouldReduceMotion ? {} : itemVariants}
            className="bg-[#080810] p-8 flex flex-col gap-5"
          >
            <ClassifyIcon className="text-white/50 size-5" strokeWidth={1.2} aria-hidden />
            <div>
              <h3 className="text-[15px] font-semibold text-white/85 mb-2" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                {features[1].title}
              </h3>
              <p className="text-[12px] text-white/30 leading-relaxed">{features[1].description}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {['LOOP', 'HALLUCINATION', 'RAG', 'CONTEXT', 'COST'].map((tag) => (
                <span key={tag} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border text-blue-400/50 border-blue-500/15 bg-blue-500/[0.04] tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Small features — col 2, rows 2-4 stacked */}
          {features.slice(2).map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={shouldReduceMotion ? {} : itemVariants}
              className="bg-[#080810] p-6 flex items-start gap-4"
            >
              <feature.icon className="text-white/35 size-4 flex-shrink-0 mt-0.5" strokeWidth={1.2} aria-hidden />
              <div>
                <h3 className="text-[13px] font-semibold text-white/75 mb-1" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
                  {feature.title}
                </h3>
                <p className="text-[11px] text-white/25 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
