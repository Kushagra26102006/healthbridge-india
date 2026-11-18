'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'framer-motion';
import { Menu, X, ChevronRight, LogOut, LayoutDashboard, ArrowUpRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { dropdownEntrance } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  onOpenAuth?: (view: 'LOGIN' | 'REGISTER') => void;
  className?: string;
}

const NAV_LINKS = [
  { label: 'Home', href: '#top', id: 'home' },
  { label: 'Overview', href: '#overview', id: 'overview' },
  { label: 'Services', href: '#services', id: 'services' },
  { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
  { label: 'Ecosystem', href: '#ecosystem', id: 'ecosystem' },
  { label: 'Privacy', href: '#privacy', id: 'privacy' },
  { label: 'About ABHA', href: '#abha', id: 'abha' },
] as const;

export function Navbar({ onOpenAuth, className }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);

      const sections = ['overview', 'services', 'how-it-works', 'ecosystem', 'privacy', 'abha'];
      const scrollPosition = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      if (window.scrollY < 220) {
        setActiveSection('home');
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        isScrolled
          ? 'glass-nav'
          : 'bg-background/80 backdrop-blur-sm border-b border-transparent',
        className
      )}
    >
      <div className="container mx-auto flex h-16 md:h-[72px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="#top"
          className="flex items-center gap-2.5 group focus-ring rounded-md py-1 shrink-0"
          aria-label="HealthBridge India Homepage"
        >
          <div className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-md bg-gradient-to-br from-brand-blue via-brand-teal to-brand-cyan text-white shadow-sm group-hover:shadow-glow transition-all duration-200">
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v18M3 12h18" stroke="white" strokeWidth="2.4" />
              <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
              <path d="M4.5 18c4-3.5 11-3.5 15 0" stroke="white" strokeWidth="1.8" />
            </svg>
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-pill bg-brand-indiaOrange border-2 border-background"
            />
          </div>

          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base md:text-lg tracking-tight text-foreground">
                Health<span className="text-secondary">Bridge</span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary">
                India
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground font-medium mt-0.5">
              One Nation • One Health Record
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-0.5 xl:gap-1"
          aria-label="Main Navigation"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 focus-ring',
                  isActive
                    ? 'text-primary font-semibold bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Dashboard</span>
                </Link>
              </Button>
              <Avatar name={user.name} size="sm" status="online" />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => logout()}
                aria-label="Sign Out"
                className="text-muted-foreground hover:text-error"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth?.('LOGIN')}
                className="font-medium"
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenAuth?.('REGISTER')}
                className="font-semibold group"
              >
                <span>Get Started</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </Button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-surface text-foreground hover:bg-muted transition-colors focus-ring"
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            id="mobile-navigation"
            variants={dropdownEntrance}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="lg:hidden glass-dropdown fixed inset-x-0 top-16 md:top-[72px] border-x-0 rounded-none z-40"
          >
            <div className="container mx-auto px-4 sm:px-6 py-5 space-y-4 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigation
                </span>
                <Badge variant="abha" size="sm">
                  ABHA-Compatible
                </Badge>
              </div>

              <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
                {NAV_LINKS.map((link) => {
                  const isActive = activeSection === link.id;
                  return (
                    <a
                      key={link.id}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors focus-ring',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground/85 hover:bg-muted'
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </a>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-border">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/60">
                      <Avatar name={user.name} size="md" status="online" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Button variant="primary" size="sm" asChild>
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          Dashboard
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-error"
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth?.('LOGIN');
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth?.('REGISTER');
                      }}
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
