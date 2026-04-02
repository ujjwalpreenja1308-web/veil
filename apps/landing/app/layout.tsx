import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Veil — AI Agent Observability',
  description: 'Monitor, detect, and fix agent failures in real time. Full visibility into every execution, decision, and cost.',
  keywords: ['AI agent observability', 'agent monitoring', 'LLM monitoring', 'AI debugging', 'agent telemetry'],
  openGraph: {
    title: 'Veil — AI Agent Observability',
    description: 'Monitor, detect, and fix agent failures in real time.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veil — AI Agent Observability',
    description: 'Monitor, detect, and fix agent failures in real time.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head />
      <body className="bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
