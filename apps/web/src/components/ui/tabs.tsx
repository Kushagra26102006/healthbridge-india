'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { triggerHaptic } from '@/lib/motion/haptics';
import { cn } from '@/lib/utils';

type TabsVariant = 'underline' | 'pills' | 'segmented';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
  variant: TabsVariant;
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = 'segmented',
  className,
  children,
  ...props
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internal;
  const baseId = React.useId();

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider
      value={{ value: activeValue, onValueChange: handleValueChange, variant, baseId }}
    >
      <div className={cn('flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, children, ...props }: TabsListProps) {
  const ctx = React.useContext(TabsContext);
  const listRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? []
    );
    if (tabs.length === 0) return;
    const currentIndex = tabs.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;
    else return;

    e.preventDefault();
    const target = tabs[nextIndex];
    target?.focus();
    target?.click();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center max-w-full overflow-x-auto',
        ctx?.variant === 'underline' && 'gap-1 border-b border-border w-full',
        ctx?.variant === 'pills' && 'gap-1.5 flex-wrap',
        ctx?.variant === 'segmented' &&
          'gap-1 rounded-md bg-muted/80 p-1 border border-border/70 w-fit',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function TabsTrigger({
  value,
  icon,
  badge,
  className,
  children,
  disabled,
  ...props
}: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;
  const tabId = `${ctx?.baseId}-tab-${value}`;
  const panelId = `${ctx?.baseId}-panel-${value}`;

  return (
    <button
      id={tabId}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => {
        if (!isActive) triggerHaptic('selection');
        ctx?.onValueChange(value);
      }}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50',
        ctx?.variant === 'underline' &&
          cn(
            'px-3.5 py-2.5 -mb-px rounded-t-sm',
            isActive
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          ),
        ctx?.variant === 'pills' &&
          cn(
            'px-3.5 py-1.5 rounded-pill border',
            isActive
              ? 'border-primary/20 bg-primary text-primary-foreground shadow-xs'
              : 'border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted/60'
          ),
        ctx?.variant === 'segmented' &&
          cn(
            'px-3 py-1.5 rounded-sm',
            isActive
              ? 'bg-surface text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          ),
        className
      )}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {badge}
      {isActive && ctx?.variant === 'underline' && (
        <m.span
          aria-hidden="true"
          initial={{ scaleX: 0.4, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.snappy }}
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-pill bg-primary"
        />
      )}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <m.div
      key={value}
      id={`${ctx.baseId}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      tabIndex={0}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
      className={cn('focus-ring rounded-md', className)}
    >
      {children}
    </m.div>
  );
}
