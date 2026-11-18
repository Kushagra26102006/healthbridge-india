'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { searchApi } from '@/features/search/api/search-api';
import type {
  GlobalSearchSuggestionItemDto,
  RecentSearchEntryDto,
} from '@healthbridge/shared-types';

interface GlobalSearchCommandProps {
  placeholder?: string;
  compact?: boolean;
}

export function GlobalSearchCommand({
  placeholder = 'Search records, doctors, prescriptions, orders...',
  compact = false,
}: GlobalSearchCommandProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GlobalSearchSuggestionItemDto[]>([]);
  const [recent, setRecent] = useState<RecentSearchEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    if (!isAuthenticated) return () => {};
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthenticated, open]);

  // Focus input & load session-only recent searches when opening dialog
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    setTimeout(() => inputRef.current?.focus(), 30);

    const controller = new AbortController();
    searchApi
      .getRecent(controller.signal)
      .then((res) => setRecent(res.entries || []))
      .catch(() => {
        // Non-fatal
      });

    return () => controller.abort();
  }, [open, isAuthenticated]);

  // Debounced autocomplete suggestions with AbortController cancellation
  useEffect(() => {
    if (!open || !isAuthenticated) return () => {};
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return () => {};
    }

    const timer = setTimeout(() => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      searchApi
        .getSuggestions(trimmed, 8, controller.signal)
        .then((res) => {
          setSuggestions(res.suggestions || []);
          setActiveIndex(0);
        })
        .catch((err: unknown) => {
          const name = err instanceof Error ? err.name : '';
          if (name === 'CanceledError' || name === 'AbortError') return;
          setError('Unable to fetch search suggestions right now.');
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query, open, isAuthenticated]);

  const navigateToSearchPage = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (!clean) return;
      setOpen(false);
      router.push(`/dashboard/search?q=${encodeURIComponent(clean)}`);
    },
    [router]
  );

  const navigateToRoute = useCallback(
    (route: string) => {
      setOpen(false);
      router.push(route);
    },
    [router]
  );

  const handleClearRecent = async () => {
    try {
      await searchApi.clearRecent();
      setRecent([]);
    } catch {
      // Ignore
    }
  };

  // Never render private search on unauthenticated pages
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* Topbar Trigger */}
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open global search"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open global search dialog"
          className="relative w-full flex items-center gap-2 pl-3 pr-12 py-1.5 text-xs rounded-xl border border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors text-left focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{placeholder}</span>
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-border bg-background">
            ⌘K
          </kbd>
        </button>
      )}

      {/* Accessible Global Search Command Dialog */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Global healthcare search"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigateToSearchPage(query);
              }}
              className="flex items-center gap-2.5 px-4 py-3 border-b border-border"
            >
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && suggestions.length > 0) {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev + 1) % suggestions.length);
                  } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                  } else if (e.key === 'Enter' && suggestions[activeIndex]) {
                    e.preventDefault();
                    navigateToRoute(suggestions[activeIndex].destinationRoute);
                  }
                }}
                placeholder={placeholder}
                maxLength={100}
                aria-label="Search query"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search query"
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground"
              >
                ESC
              </button>
            </form>

            {/* Body: Suggestions / Recent / Loading / Empty / Error */}
            <div className="max-h-96 overflow-y-auto p-3 space-y-3 text-xs">
              {loading ? (
                <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>Searching authorized records...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : query.trim().length >= 2 ? (
                suggestions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground space-y-2">
                    <p>No instant suggestions found for &ldquo;{query.trim()}&rdquo;.</p>
                    <button
                      type="button"
                      onClick={() => navigateToSearchPage(query)}
                      className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                    >
                      <span>Run full filtered search</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Authorized Suggestions ({user.role})
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateToRoute(item.destinationRoute)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                          idx === activeIndex
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-foreground'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{item.title}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                          {item.resourceType}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Recent Searches (Session Only)
                    </span>
                    {recent.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearRecent}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                  {recent.length === 0 ? (
                    <p className="px-2 py-6 text-center text-muted-foreground">
                      Type at least 2 characters to search authorized resources for your {user.role.toLowerCase()} account.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {recent.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => navigateToSearchPage(entry.query)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted flex items-center justify-between gap-2"
                        >
                          <span className="inline-flex items-center gap-2 text-foreground">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{entry.query}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {query.trim().length > 0 && (
              <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">
                  Server-enforced role scope • Zero sensitive clinical previews
                </span>
                <button
                  type="button"
                  onClick={() => navigateToSearchPage(query)}
                  className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <span>View All Results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
