'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, type Theme } from '@/providers';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun className="h-4 w-4 text-amber-500" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4 text-indigo-400" /> },
    {
      id: 'system',
      label: 'System',
      icon: <Laptop className="h-4 w-4 text-slate-500 dark:text-slate-400" />,
    },
  ];

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Toggle theme, current theme is ${theme} (${resolvedTheme})`}
        className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-input bg-background/80 backdrop-blur-xs text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-200" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200" />
        )}
        <span className="sr-only">Toggle theme</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-1.5 text-popover-foreground shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-50 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {themes.map((item) => {
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setTheme(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left',
                  isSelected
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-semibold'
                    : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
