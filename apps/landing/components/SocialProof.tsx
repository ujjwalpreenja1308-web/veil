'use client'

import {
  siAnthropic,
  siLangchain,
  siN8n,
  siGoogle,
  siGooglegemini,
  siMeta,
  siPython,
  siHuggingface,
  siCrewai,
  siClaude,
  siOllama,
  siVercel,
  siFastapi,
  siPytorch,
} from 'simple-icons'

const integrations = [
  { name: 'Anthropic', icon: siAnthropic },
  { name: 'LangChain', icon: siLangchain },
  { name: 'Google Gemini', icon: siGooglegemini },
  { name: 'CrewAI', icon: siCrewai },
  { name: 'Hugging Face', icon: siHuggingface },
  { name: 'Meta', icon: siMeta },
  { name: 'Claude', icon: siClaude },
  { name: 'Ollama', icon: siOllama },
  { name: 'FastAPI', icon: siFastapi },
  { name: 'PyTorch', icon: siPytorch },
  { name: 'n8n', icon: siN8n },
  { name: 'Python', icon: siPython },
]

const ribbon = [...integrations, ...integrations, ...integrations]

function BrandLogo({ name, icon }: { name: string; icon: typeof siAnthropic }) {
  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap text-white/25 hover:text-white/50 transition-colors duration-300 cursor-default group">
      <svg
        role="img"
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="currentColor"
        aria-label={name}
      >
        <path d={icon.path} />
      </svg>
      <span className="text-[13px] font-medium tracking-tight">{name}</span>
    </span>
  )
}

export default function SocialProof() {
  return (
    <section className="relative py-12 overflow-hidden border-y border-white/[0.04]">
      {/* Edge fades */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{ width: '16%', background: 'linear-gradient(to right, #080810 0%, transparent 100%)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{ width: '16%', background: 'linear-gradient(to left, #080810 0%, transparent 100%)' }}
      />

      {/* Label */}
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-white/20 mb-8">
        Built for engineers building on
      </p>

      {/* Ribbon */}
      <div className="relative flex overflow-hidden select-none" aria-hidden="true">
        <div
          className="flex shrink-0 gap-10 items-center"
          style={{ animation: 'marquee-left 36s linear infinite' }}
        >
          {ribbon.map((item, i) => (
            <BrandLogo key={`${item.name}-${i}`} name={item.name} icon={item.icon} />
          ))}
        </div>
        <div
          className="flex shrink-0 gap-10 items-center"
          style={{ animation: 'marquee-left 36s linear infinite' }}
          aria-hidden="true"
        >
          {ribbon.map((item, i) => (
            <BrandLogo key={`dup-${item.name}-${i}`} name={item.name} icon={item.icon} />
          ))}
        </div>
      </div>
    </section>
  )
}
