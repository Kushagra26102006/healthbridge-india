'use client';

import * as React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { dropdownEntrance } from '@/lib/motion/variants';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({ children, className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div ref={rootRef} className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function DropdownTrigger({ className, onClick, children, ...props }: DropdownTriggerProps) {
  const ctx = React.useContext(DropdownContext);

  return (
    <button
      ref={ctx?.triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={ctx?.open}
      onClick={(e) => {
        ctx?.setOpen((prev) => !prev);
        onClick?.(e);
      }}
      className={cn('focus-ring', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right';
}

export function DropdownContent({
  align = 'right',
  className,
  children,
}: DropdownContentProps) {
  const ctx = React.useContext(DropdownContext);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ??
        []
    );
    if (items.length === 0) return;
    const idx = items.findIndex((el) => el === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    }
  };

  return (
    <AnimatePresence>
      {ctx?.open && (
        <m.div
          ref={menuRef}
          role="menu"
          variants={dropdownEntrance}
          initial="hidden"
          animate="visible"
          exit="exit"
          onKeyDown={handleKeyDown}
          className={cn(
            'glass-dropdown absolute mt-2 min-w-[12rem] rounded-lg p-1.5 text-popover-foreground z-50 origin-top-right',
            align === 'right' ? 'right-0' : 'left-0 origin-top-left',
            className
          )}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
  closeOnSelect?: boolean;
}

export function DropdownItem({
  icon,
  destructive = false,
  closeOnSelect = true,
  className,
  onClick,
  children,
  disabled,
  ...props
}: DropdownItemProps) {
  const ctx = React.useContext(DropdownContext);

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (closeOnSelect) ctx?.setOpen(false);
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors',
        'focus-visible:outline-none focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-50',
        destructive
          ? 'text-error hover:bg-red-50 dark:hover:bg-red-950/40'
          : 'text-foreground hover:bg-muted/80',
        className
      )}
      {...props}
    >
      {icon && (
        <span className="h-4 w-4 shrink-0 inline-flex items-center justify-center opacity-80" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export function DropdownSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 h-px bg-border', className)} />;
}
