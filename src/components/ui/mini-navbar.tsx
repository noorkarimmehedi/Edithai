"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { GmailConnectionStatus } from '@/components/gmail/connection-status';
import { CalendarConnectionStatus } from '@/components/calendar/connection-status';
import { LogoIcon } from '@/components/ui/logo-icon';

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <Link href={href} className="group relative inline-flex items-center h-8 px-3 rounded-full text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition-all duration-200">
      {children}
    </Link>
  );
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinksData = [
    { label: 'Assistant', href: '/assistant' },
  ];

  return (
    <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-50
                       flex items-center gap-2
                       px-3 py-2
                       rounded-full
                       transition-all duration-300
                       ${scrolled
                         ? 'bg-background/60 border border-border/40 backdrop-blur-3xl shadow-[0_8px_40px_-4px_rgba(0,0,0,0.1)]'
                         : 'bg-background/40 border border-border/30 backdrop-blur-3xl shadow-[0_8px_40px_-4px_rgba(0,0,0,0.05)]'}
                       w-[calc(100%-2rem)] sm:w-auto sm:min-w-[480px] max-w-[580px]`}>
      
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <LogoIcon className="w-6 h-6 text-foreground hover:text-foreground/80 transition-colors" />
        <span className="text-sm font-medium text-foreground hidden sm:inline font-pixelify">Edith</span>
      </Link>

      <nav className="hidden sm:flex items-center gap-1">
        {navLinksData.map((link) => (
          <AnimatedNavLink key={link.href} href={link.href}>
            {link.label}
          </AnimatedNavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2 ml-auto min-w-0">
        {pathname === "/assistant" && <GmailConnectionStatus />}
        {pathname === "/assistant" && <CalendarConnectionStatus />}
        <ThemeToggle />
        
        <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
          <Link href="/login" className="px-3 py-1.5 text-xs border border-border bg-muted/50 text-muted-foreground rounded-full hover:border-foreground/30 hover:text-foreground transition-colors duration-200 whitespace-nowrap">
            Log in
          </Link>
          <Link href="/signup" className="px-3 py-1.5 text-xs font-semibold text-background bg-foreground rounded-full hover:bg-foreground/80 transition-all duration-200 whitespace-nowrap">
            Sign up
          </Link>
        </div>

        <button 
          className="sm:hidden flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-foreground/10 rounded-full transition-all duration-200" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close Menu' : 'Open Menu'}
        >
          {isOpen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden absolute top-full left-0 right-0 mt-2 mx-0 rounded-2xl border border-border/30 bg-background/60 backdrop-blur-3xl overflow-hidden transition-all duration-300 ease-out
                       ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
        <nav className="flex flex-col p-3 gap-1">
          {navLinksData.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-all"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {pathname === "/assistant" && (
          <div className="flex flex-col p-3 pt-0 gap-2 border-t border-border/20">
            <GmailConnectionStatus />
            <CalendarConnectionStatus />
          </div>
        )}
        <div className="flex flex-row p-3 pt-2 gap-2 border-t border-border/20">
          <Link href="/login" className="flex-1 px-4 py-2.5 text-xs border border-border bg-muted/50 text-muted-foreground rounded-full hover:border-foreground/30 hover:text-foreground transition-colors duration-200 text-center whitespace-nowrap" onClick={() => setIsOpen(false)}>
            Log in
          </Link>
          <Link href="/signup" className="flex-1 px-4 py-2.5 text-xs font-semibold text-background bg-foreground rounded-full hover:bg-foreground/80 transition-all duration-200 text-center whitespace-nowrap" onClick={() => setIsOpen(false)}>
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
