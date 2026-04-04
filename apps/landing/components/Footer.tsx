'use client';

import React from 'react';
import { Mail, Globe, BookOpen, ExternalLink } from 'lucide-react';
import { FooterBackgroundGradient, TextHoverEffect } from '@/components/ui/hover-footer';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Documentation', href: 'https://docs.veil.dev' },
      { label: 'Changelog', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

const contactInfo = [
  {
    icon: <Mail size={15} className="text-blue-400/70" />,
    text: 'hello@veil.dev',
    href: 'mailto:hello@veil.dev',
  },
];

const socialLinks = [
  { icon: <Globe size={16} />, label: 'GitHub', href: '#' },
  { icon: <ExternalLink size={16} />, label: 'Twitter / X', href: '#' },
  { icon: <BookOpen size={16} />, label: 'Docs', href: 'https://docs.veil.dev' },
];

export default function Footer() {
  return (
    <footer className="bg-[#080810] relative overflow-hidden mx-4 mb-4 rounded-2xl border border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-8 pt-16 pb-0 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
          {/* Brand */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Veil" className="w-5 h-5" />
            </div>
            <p className="text-[12px] text-white/25 leading-relaxed max-w-[18ch]">
              Observability for AI agents. Catch failures before your users do.
            </p>
            {contactInfo.map((item, i) => (
              <a
                key={i}
                href={item.href}
                className="flex items-center gap-2 text-[12px] text-white/25 hover:text-white/50 transition-colors"
              >
                {item.icon}
                {item.text}
              </a>
            ))}
          </div>

          {/* Link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.18em] mb-5">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-white/25 hover:text-white/60 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <h4 className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.18em] mb-5">
              Connect
            </h4>
            <div className="flex flex-col gap-3">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center gap-2.5 text-[13px] text-white/25 hover:text-white/60 transition-colors duration-200"
                >
                  {icon}
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.05] py-5 flex items-center justify-between">
          <p className="text-[11px] font-mono text-white/15 tracking-wide">
            &copy; {new Date().getFullYear()} Veil. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="/privacy" className="text-[11px] text-white/15 hover:text-white/40 transition-colors">Privacy</a>
            <a href="/terms" className="text-[11px] text-white/15 hover:text-white/40 transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-64 -mt-20 -mb-10 relative z-10">
        <TextHoverEffect text="Veil" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
