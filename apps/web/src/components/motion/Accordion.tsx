'use client';

import * as React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

export interface AccordionItemData {
  id: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItemData[];
  type?: 'single' | 'multiple';
  defaultOpenIds?: string[];
  className?: string;
}

export function Accordion({
  items,
  type = 'single',
  defaultOpenIds = [],
  className,
}: AccordionProps) {
  const [openIds, setOpenIds] = React.useState<string[]>(defaultOpenIds);
  const baseId = React.useId();

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (isOpen) return prev.filter((item) => item !== id);
      return type === 'single' ? [id] : [...prev, id];
    });
  };

  return (
    <div className={cn('divide-y divide-border rounded-lg border border-border bg-card shadow-sm', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id} className="first:rounded-t-lg last:rounded-b-lg">
            <button
              id={triggerId}
              type="button"
              disabled={item.disabled}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 focus-ring disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                )}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180 text-primary'
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: 1,
                    height: 'auto',
                    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed">
                    {item.content}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
