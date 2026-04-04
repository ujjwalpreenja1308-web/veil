// Absolute grid overlay — sits inside a relative container, only covers sections below hero+marquee
// Pointer-events-none, purely decorative
export function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]" aria-hidden="true">

      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 4%, rgba(0,0,0,0.6) 92%, transparent 100%)',
        }}
      />

      {/* Vertical lines — outside the widest section (max-w-[1400px] + px-16 = ~1464px effective) */}
      <div className="absolute inset-0 max-w-[1480px] mx-auto">
        <div
          className="absolute top-0 bottom-0 left-0 w-px"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.07) 4%, rgba(255,255,255,0.07) 92%, transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-px"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.07) 4%, rgba(255,255,255,0.07) 92%, transparent 100%)',
          }}
        />
      </div>

    </div>
  )
}
