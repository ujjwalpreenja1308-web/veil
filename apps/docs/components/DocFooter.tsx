'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Globe, ExternalLink, BookOpen } from 'lucide-react';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: 'https://veil.dev/dashboard' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
];

const contactInfo = [
  {
    icon: <Mail size={15} style={{ color: 'rgba(96,165,250,0.7)' }} />,
    text: 'hello@veil.dev',
    href: 'mailto:hello@veil.dev',
  },
];

const socialLinks = [
  { icon: <Globe size={16} />, label: 'GitHub', href: '#' },
  { icon: <ExternalLink size={16} />, label: 'Twitter / X', href: '#' },
  { icon: <BookOpen size={16} />, label: 'Docs', href: 'https://docs.veil.dev' },
];

function TextHoverEffect({ text }: { text: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: '50%', cy: '50%' });

  useEffect(() => {
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({ cx: `${cxPercentage}%`, cy: `${cyPercentage}%` });
    }
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      style={{ userSelect: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
    >
      <defs>
        <linearGradient id="docTextGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
          {hovered && (
            <>
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="25%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#93c5fd" />
              <stop offset="75%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </>
          )}
        </linearGradient>
        <radialGradient id="docRevealMask" gradientUnits="userSpaceOnUse" r="20%" cx={maskPosition.cx} cy={maskPosition.cy}>
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <mask id="docTextMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#docRevealMask)" />
        </mask>
      </defs>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" strokeWidth="0.3"
        style={{ fill: 'transparent', stroke: 'rgba(255,255,255,0.1)', fontSize: '7rem', fontWeight: 'bold', opacity: hovered ? 0.7 : 0 }}>
        {text}
      </text>
      <motion.text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" strokeWidth="0.3"
        style={{ fill: 'transparent', stroke: 'rgba(255,255,255,0.06)', fontSize: '7rem', fontWeight: 'bold' }}
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
        transition={{ duration: 4, ease: 'easeInOut' }}>
        {text}
      </motion.text>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" stroke="url(#docTextGradient)"
        strokeWidth="0.3" mask="url(#docTextMask)"
        style={{ fill: 'transparent', fontSize: '7rem', fontWeight: 'bold' }}>
        {text}
      </text>
    </svg>
  );
}

export default function DocFooter() {
  return (
    <footer style={{
      background: '#080810',
      position: 'relative',
      overflow: 'hidden',
      margin: '0 16px 16px',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        background: 'radial-gradient(125% 125% at 50% 10%, #08081066 50%, #3b82f620 100%)',
      }} />

      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '64px 32px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', paddingBottom: '48px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3L8 1L13 3V8C13 11.3137 10.3137 14 7 14H8C4.68629 14 2 11.3137 2 8V3Z" fill="white" fillOpacity="0.92" />
                  <path d="M6 7.5L7.5 9L10.5 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '14px', letterSpacing: '-0.02em' }}>Veil</span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, maxWidth: '18ch' }}>
              Observability for AI agents. Catch failures before your users do.
            </p>
            {contactInfo.map((item, i) => (
              <a key={i} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
                {item.icon}
                {item.text}
              </a>
            ))}
          </div>

          {/* Link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '20px' }}>
                {section.title}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '20px' }}>
              Connect
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {socialLinks.map(({ icon, label, href }) => (
                <a key={label} href={href} aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
                  {icon}
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.05em', margin: 0 }}>
            &copy; {new Date().getFullYear()} Veil. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </div>

      {/* Text hover effect */}
      <div style={{ height: '160px', marginTop: '-80px', marginBottom: '-40px', position: 'relative', zIndex: 1 }}>
        <TextHoverEffect text="Veil" />
      </div>
    </footer>
  );
}
