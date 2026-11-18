'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  MessageSquareHeart,
  X,
  Send,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  assistantApi,
  type AssistantActionLinkDto,
} from '@/features/assistant/api/assistant-api';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  isEmergency?: boolean;
  actions?: AssistantActionLinkDto[];
  suggestions?: string[];
  timestamp: string;
}

const ROLE_LABELS: Record<string, string> = {
  PATIENT: 'Patient Portal',
  DOCTOR: 'Doctor Workspace',
  PHARMACY: 'Pharmacy Desk',
  LABORATORY: 'Lab Operations',
  ADMIN: 'Admin Control',
};

function getStarterPrompts(role?: string): string[] {
  switch (role) {
    case 'PATIENT':
      return [
        'Book an appointment',
        'Upload a medical record',
        'Manage data consent',
        'How does ABHA work?',
      ];
    case 'DOCTOR':
      return [
        'View today’s patient queue',
        'Start a clinical consultation',
        'Write a digital prescription',
      ];
    case 'PHARMACY':
      return [
        'Open prescription queue',
        'Check low stock & expiry alerts',
        'Dispense a prescription',
      ];
    case 'LABORATORY':
      return [
        'Review lab test orders',
        'Scan sample barcode',
        'Authorize diagnostic reports',
      ];
    case 'ADMIN':
      return ['Open immutable audit logs', 'Check ABDM readiness', 'Review security center'];
    default:
      return [
        'How do I register on HealthBridge?',
        'What is ABHA & ABDM?',
        'How is my medical data protected?',
      ];
  }
}

function createWelcomeMessage(role?: string, name?: string): ChatMessage {
  const greeting = name ? `Hello ${name.split(' ')[0]}!` : 'Hello!';
  return {
    id: 'welcome',
    sender: 'assistant',
    text: `${greeting} I’m the **HealthBridge Assistant**. Ask me how to navigate your portal, manage records or consent, or understand ABHA/ABDM workflows.`,
    suggestions: getStarterPrompts(role),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Safely renders **bold** segments without using dangerouslySetInnerHTML.
 */
function renderSafeRichText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function HealthBridgeChatbot() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    [createWelcomeMessage(user?.role, user?.name)]
  );

  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const activeUserKey = `${user?.id ?? 'guest'}:${user?.role ?? 'PUBLIC'}`;

  // Clear in-memory chat automatically when user logs in, logs out, or switches role
  useEffect(() => {
    setMessages([createWelcomeMessage(user?.role, user?.name)]);
    setInput('');
  }, [activeUserKey, user?.role, user?.name]);

  // Focus input when opened & support Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isSending, isOpen]);

  const roleBadge = useMemo(
    () => (user?.role ? ROLE_LABELS[user.role] || user.role : 'Public Guide'),
    [user?.role]
  );

  const handleSend = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const reply = await assistantApi.sendMessage(text, pathname || undefined);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: reply.reply,
          isEmergency: reply.isEmergency,
          actions: reply.actions,
          suggestions: reply.suggestions,
          timestamp: reply.timestamp,
        },
      ]);
    } catch {
      const isEmergency = /\b(chest pain|heart attack|stroke|can'?t breathe|emergency|bleeding)\b/i.test(
        text
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          sender: 'assistant',
          text: isEmergency
            ? 'If this is a medical emergency, call **112** or **108** immediately or visit the nearest emergency department.'
            : 'I could not reach the HealthBridge Assistant server right now. You can still use the sidebar navigation or press **Cmd+K / Ctrl+K** to jump directly to any portal section.',
          isEmergency,
          suggestions: getStarterPrompts(user?.role),
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleReset = () => {
    setMessages([createWelcomeMessage(user?.role, user?.name)]);
    setInput('');
    inputRef.current?.focus();
  };

  // Position cleanly above API Status pill on landing page and above MobileBottomNav on mobile dashboards
  const positionClass =
    pathname === '/' ? 'bottom-16 right-4' : 'bottom-20 md:bottom-5 right-4 sm:right-5';

  return (
    <div className={cn('fixed z-40 flex flex-col items-end gap-3', positionClass)}>
      <AnimatePresence>
        {isOpen && (
          <m.section
            role="dialog"
            aria-label="HealthBridge Assistant Chatbot"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-[calc(100vw-2rem)] sm:w-[390px] max-h-[min(74vh,560px)] flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3.5 bg-gradient-to-r from-[#0B1F3A] via-[#0F2F4C] to-[#0D6B68] text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-teal-200" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold leading-tight truncate">
                    HealthBridge Assistant
                  </h2>
                  <p className="text-[11px] text-teal-100/90 truncate">{roleBadge} • Instant Guide</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Clear chat conversation"
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors focus-ring"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    launcherRef.current?.focus();
                  }}
                  aria-label="Close HealthBridge Assistant"
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors focus-ring"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Messages Thread */}
            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-muted/25"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col gap-2',
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs',
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : msg.isEmergency
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 border border-rose-300 dark:border-rose-800 rounded-bl-sm'
                          : 'bg-card text-foreground border border-border rounded-bl-sm'
                    )}
                  >
                    {msg.isEmergency && (
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs mb-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Emergency Medical Guidance (India: 112 / 108)</span>
                      </div>
                    )}
                    <p>{renderSafeRichText(msg.text)}</p>
                  </div>

                  {/* Action Links */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-w-[92%]">
                      {msg.actions.map((action) => (
                        <button
                          key={`${msg.id}-${action.href}`}
                          type="button"
                          onClick={() => handleNavigate(action.href)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/12 hover:bg-secondary/20 text-secondary dark:text-teal-300 border border-secondary/25 text-xs font-semibold transition-colors focus-ring"
                        >
                          <span>{action.label}</span>
                          <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Suggestions (shown on latest assistant bubble) */}
                  {msg.sender === 'assistant' &&
                    msg.suggestions &&
                    msg.suggestions.length > 0 &&
                    msg.id === messages[messages.length - 1]?.id && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5 max-w-full">
                        {msg.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => void handleSend(suggestion)}
                            disabled={isSending}
                            className="px-2.5 py-1 rounded-full bg-surface hover:bg-muted text-foreground/85 border border-border text-[11px] font-medium transition-colors focus-ring disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary" aria-hidden="true" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={scrollEndRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="p-3 border-t border-border bg-card space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                  placeholder="Ask about records, appointments, ABHA..."
                  aria-label="Message HealthBridge Assistant"
                  className="flex-1 h-10 px-3 rounded-xl border border-input bg-surface text-foreground text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  aria-label="Send message"
                  className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-45 flex items-center justify-center shrink-0 transition-colors focus-ring"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground leading-snug">
                <ShieldCheck className="w-3 h-3 text-secondary shrink-0" aria-hidden="true" />
                <span>Navigation guide only — not medical advice. Call 112/108 in emergencies.</span>
              </p>
            </form>
          </m.section>
        )}
      </AnimatePresence>

      {/* Floating Launcher Pill */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close HealthBridge Assistant' : 'Open HealthBridge Assistant'}
        className="group inline-flex items-center gap-2 h-12 px-4 rounded-full bg-gradient-to-r from-brand-blue via-brand-teal to-brand-cyan text-white shadow-lg hover:shadow-xl hover:brightness-105 active:scale-95 transition-all duration-150 focus-ring"
      >
        {isOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <MessageSquareHeart className="w-5 h-5" aria-hidden="true" />
        )}
        <span className="text-xs sm:text-sm font-semibold tracking-tight">
          {isOpen ? 'Close Chat' : 'Health Assistant'}
        </span>
      </button>
    </div>
  );
}

export default HealthBridgeChatbot;
