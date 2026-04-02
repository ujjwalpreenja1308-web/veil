'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  GitBranch,
  LucideIcon,
  Repeat2,
  Zap,
} from 'lucide-react'
import { ReactNode } from 'react'

export function Features() {
  return (
    <section className="py-20 md:py-36" id="capabilities">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
        {/* Section label */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/25 mb-5">
          What you get
        </p>
        <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-14 max-w-lg"
          style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        >
          Built to ship reliable agents
        </h2>

        <div className="grid gap-px bg-white/[0.05] lg:grid-cols-2">

          {/* Card 1 — Real-time traces */}
          <FeatureCard>
            <CardHeader className="pb-0">
              <CardHeading
                icon={Activity}
                title="Live execution traces"
                description="Every LLM call, tool invocation, and decision logged with millisecond timing."
              />
            </CardHeader>
            <CardContent className="pt-6">
              <TracePreview />
            </CardContent>
          </FeatureCard>

          {/* Card 2 — Failure classification */}
          <FeatureCard>
            <CardHeader className="pb-0">
              <CardHeading
                icon={AlertTriangle}
                title="Failure classification"
                description="10 built-in rules. Context exhaustion, loops, hallucinations. All caught automatically."
              />
            </CardHeader>
            <CardContent className="pt-6">
              <FailureBadges />
            </CardContent>
          </FeatureCard>

          {/* Card 3 — Wide, spanning both cols */}
          <FeatureCard className="lg:col-span-2 flex flex-col md:flex-row items-stretch gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
            {/* Left */}
            <div className="flex-1 p-8 flex flex-col gap-6">
              <CardHeading
                icon={BarChart3}
                title="Cost per run"
                description="Token spend and API cost broken down by step. Know exactly where money goes."
              />
              <CostBreakdown />
            </div>
            {/* Right */}
            <div className="flex-1 p-8 flex flex-col gap-6">
              <CardHeading
                icon={Repeat2}
                title="Pattern detection"
                description="Recurring failure signatures clustered across hundreds of runs automatically."
              />
              <PatternStats />
            </div>
          </FeatureCard>

        </div>
      </div>
    </section>
  )
}

// ── Sub-components ──────────────────────────────────────────

interface FeatureCardProps {
  children: ReactNode
  className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card
    className={cn(
      'relative rounded-none border-0 bg-[#080810] shadow-none',
      className
    )}
  >
    <CardDecorator />
    {children}
  </Card>
)

const CardDecorator = () => (
  <>
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-blue-500/40" />
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-blue-500/40" />
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-blue-500/40" />
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-blue-500/40" />
  </>
)

interface CardHeadingProps {
  icon: LucideIcon
  title: string
  description: string
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
  <div>
    <span className="flex items-center gap-2 text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-white/25">
      <Icon className="size-3.5" strokeWidth={1.5} />
      {title}
    </span>
    <p className="mt-4 text-[15px] font-medium text-white/70 leading-snug max-w-[36ch]">
      {description}
    </p>
  </div>
)

// ── Feature illustrations ──────────────────────────────────

function TracePreview() {
  const events = [
    { t: '09:41:01', label: 'session.start', c: '#60a5fa' },
    { t: '09:41:02', label: 'tool.call → web_search', c: '#86efac' },
    { t: '09:41:03', label: 'llm.response  847 tok', c: '#60a5fa' },
    { t: '09:41:04', label: 'tool.call → read_file', c: '#86efac' },
    { t: '09:41:06', label: 'context_exhaustion', c: '#f87171' },
    { t: '09:41:06', label: 'alert dispatched', c: '#fbbf24' },
  ]
  return (
    <div
      className="rounded-xl p-4 font-mono text-[11px] space-y-2"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {events.map((ev, i) => (
        <div key={i} className="flex items-baseline gap-3">
          <span className="text-white/20 tabular-nums shrink-0">{ev.t}</span>
          <span style={{ color: ev.c }}>{ev.label}</span>
        </div>
      ))}
    </div>
  )
}

function FailureBadges() {
  const failures = [
    { label: 'context_exhaustion', color: '#f87171' },
    { label: 'infinite_loop', color: '#fb923c' },
    { label: 'hallucination', color: '#c084fc' },
    { label: 'rag_failure', color: '#fbbf24' },
    { label: 'prompt_injection', color: '#f87171' },
    { label: 'cost_anomaly', color: '#34d399' },
    { label: 'tool_failure', color: '#60a5fa' },
    { label: 'goal_drift', color: '#fb923c' },
    { label: 'latency_spike', color: '#a78bfa' },
    { label: 'silent_failure', color: '#94a3b8' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {failures.map(({ label, color }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px]"
          style={{
            background: `${color}10`,
            border: `1px solid ${color}30`,
            color: color,
          }}
        >
          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  )
}

function CostBreakdown() {
  const steps = [
    { label: 'web_search', tokens: 124, cost: '$0.001' },
    { label: 'llm.response', tokens: 847, cost: '$0.008' },
    { label: 'read_file', tokens: 203, cost: '$0.002' },
  ]
  return (
    <div className="space-y-2">
      {steps.map(({ label, tokens, cost }) => (
        <div
          key={label}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="font-mono text-[11px] text-white/50">{label}</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-white/25">{tokens} tok</span>
            <span className="font-mono text-[11px] text-blue-400/70">{cost}</span>
          </div>
        </div>
      ))}
      <div className="flex justify-between px-3 pt-2">
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">Total</span>
        <span className="font-mono text-[11px] font-bold text-white/60">$0.011</span>
      </div>
    </div>
  )
}

function PatternStats() {
  const patterns = [
    { label: 'context_exhaustion', count: 47, pct: 82 },
    { label: 'infinite_loop', count: 23, pct: 40 },
    { label: 'tool_failure', count: 11, pct: 19 },
  ]
  return (
    <div className="space-y-3">
      {patterns.map(({ label, count, pct }) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[11px] text-white/45">{label}</span>
            <span className="font-mono text-[11px] text-white/25">{count} runs</span>
          </div>
          <div className="h-px w-full bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500/50 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
