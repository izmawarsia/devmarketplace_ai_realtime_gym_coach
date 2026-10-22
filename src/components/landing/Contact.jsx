import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

const LINKS = [
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com', color: '#0a66c2' },
  { name: 'GitHub', icon: Github, href: 'https://github.com', color: '#ffffff' },
  { name: 'Twitter / X', icon: Twitter, href: 'https://x.com', color: '#00d4ff' },
  { name: 'Gmail', icon: Mail, href: 'mailto:hello@aigymcoach.app', color: '#f5a623' },
];

export default function Contact() {
  return (
    <>
      <section id="contact" className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#f5a623]">// Let's Connect</p>
        <h2 className="font-serif-landing mx-auto mt-3 max-w-2xl text-3xl font-bold text-white sm:text-5xl">
          Built by a human. Backed by data.
        </h2>

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {LINKS.map(({ name, icon: Icon, href, color }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-[#111111] px-4 py-6 transition hover:-translate-y-1 hover:border-white/20"
            >
              <Icon size={24} style={{ color }} className="transition group-hover:scale-110" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-white">
                {name}
              </span>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center">
        <p className="font-mono text-xs tracking-widest text-gray-600">
          <span className="text-[#f5a623]">(</span>AI GYM COACH<span className="text-[#f5a623]">)</span>
          {' '}· © {new Date().getFullYear()} AI GYM Trainer. All rights reserved.
        </p>
      </footer>
    </>
  );
}
