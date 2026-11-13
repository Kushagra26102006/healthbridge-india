'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  onOpenAuth?: (view: 'LOGIN' | 'REGISTER') => void;
  className?: string;
}

export function Navbar({ onOpenAuth, className }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { user, isAuthenticated, logout } = useAuth();

  // Handle scroll detection for refined shadow & active link spy
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['patients', 'doctors', 'providers', 'how-it-works', 'about'];
      const scrollPosition = window.scrollY + 100;

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
      if (window.scrollY < 200) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key
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

  const navLinks = [
    { label: 'Home', href: '#top', id: 'home' },
    { label: 'For Patients', href: '#patients', id: 'patients' },
    { label: 'For Doctors', href: '#doctors', id: 'doctors' },
    { label: 'For Healthcare Providers', href: '#providers', id: 'providers' },
    { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
    { label: 'About Us', href: '#about', id: 'about' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200 border-b',
        isScrolled
          ? 'bg-background/90 backdrop-blur-md border-border/80 shadow-subtle'
          : 'bg-background/70 backdrop-blur-sm border-transparent',
        className
      )}
    >
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & National Health Tagline */}
        <Link
          href="#top"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
          aria-label="HealthBridge India Homepage"
        >
          {/* Healthcare-inspired custom logo mark: Medical Shield with Bridge Arch */}
          <div className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-blue-700 via-teal-600 to-cyan-500 text-white shadow-md shadow-teal-500/10 group-hover:shadow-glow transition-all duration-300">
            <svg
              className="w-6 h-6 transform group-hover:scale-105 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Medical cross + interconnected bridge node */}
              <path d="M12 2v20M2 12h20" stroke="white" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.2" />
              <path d="M4 18c4-4 12-4 16 0" stroke="white" strokeWidth="2" strokeDasharray="1 1" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-indiaOrange border-2 border-background" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg md:text-xl tracking-tight text-foreground">
                Health<span className="text-teal-600 dark:text-teal-400">Bridge</span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary dark:bg-primary/20">
                India
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] text-muted-foreground font-medium tracking-tight">
              One Nation • One Health Record
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'text-primary font-semibold bg-primary/10 dark:bg-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Session or Guest CTAs */}
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-tight hidden xl:block">
                  <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {user.role.toLowerCase()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-xs text-muted-foreground hover:text-destructive gap-1 px-2 h-8"
                aria-label="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth?.('LOGIN')}
                className="text-sm font-medium text-foreground hover:text-primary hover:bg-accent"
              >
                Login
              </Button>
              <Button
                variant="teal"
                size="sm"
                onClick={() => onOpenAuth?.('REGISTER')}
                className="text-sm font-semibold shadow-sm"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
            className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-input bg-background/80 text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Overlay */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="lg:hidden fixed inset-x-0 top-16 md:top-20 bg-background/98 backdrop-blur-xl border-b border-border shadow-xl z-40 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="container mx-auto px-6 py-6 space-y-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </span>
              <Badge variant="abha" className="text-[10px]">
                ABHA Integrated
              </Badge>
            </div>

            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 font-semibold'
                        : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                );
              })}
            </nav>

            {/* Mobile Auth Actions */}
            <div className="pt-4 border-t border-border space-y-2.5">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {user.role} • {user.accountStatus}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
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
                    variant="teal"
                    className="w-full shadow-sm"
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
        </div>
      )}
    </header>
  );
}

export default Navbar;
