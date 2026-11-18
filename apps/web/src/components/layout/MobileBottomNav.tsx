'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { triggerHaptic } from '@/lib/motion/haptics';
import { cn } from '@/lib/utils';

export interface MobileBottomNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
  onOpenMore: () => void;
  ariaLabel?: string;
}

/**
 * Touch-friendly, safe-area-aware mobile bottom navigation bar (`< lg:`).
 * Exposes 4 high-frequency role destinations + a "More" trigger opening the full sidebar drawer,
 * ensuring 100% of desktop routes remain accessible on mobile devices (320px..1023px).
 */
export function MobileBottomNav({
  items,
  onOpenMore,
  ariaLabel = 'Primary mobile navigation',
}: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (item: MobileBottomNavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav
      aria-label={ariaLabel}
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-nav border-t border-border pb-safe print:hidden"
    >
      <div className="grid grid-cols-5 items-stretch max-w-xl mx-auto px-1">
        {items.slice(0, 4).map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onClick={() => triggerHaptic('selection')}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 py-1.5 text-[10px] sm:text-[11px] font-medium transition-colors focus-ring rounded-md relative',
                active
                  ? 'text-primary dark:text-secondary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-3 h-0.5 rounded-b-pill bg-primary dark:bg-secondary"
                />
              )}
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-full leading-tight">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onOpenMore();
          }}
          aria-label="Open full navigation menu"
          className="flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-1 py-1.5 text-[10px] sm:text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-md"
        >
          <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-full leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}

export default MobileBottomNav;
