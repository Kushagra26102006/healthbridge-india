'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  ArrowRight,
  Trash2,
  Zap,
  Compass,
  EyeOff,
  Eye,
  CalendarPlus,
  Calendar,
  FileHeart,
  Pill,
  FlaskConical,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  Stethoscope,
  ClipboardPlus,
  Package,
  AlertTriangle,
  ShoppingBag,
  PlusCircle,
  ScanBarcode,
  TestTube2,
  FileCheck2,
  Beaker,
  Activity,
  Lock,
  ScrollText,
  Building2,
  CornerDownLeft,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { searchApi } from '@/features/search/api/search-api';
import {
  filterQuickActions,
  type QuickActionIconKey,
  type RoleQuickAction,
} from '@/features/search/lib/quick-actions';
import {
  clearRecentPages,
  getRecentPages,
  isSearchHistoryEnabled,
  recordRecentPage,
  setSearchHistoryEnabled,
  type RecentPageEntry,
} from '@/features/search/lib/recent-navigation';
import { HighlightMatch } from '@/components/search/HighlightMatch';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';
import { modalBackdrop, modalEntrance } from '@/lib/motion/variants';
import type {
  GlobalSearchSuggestionItemDto,
  RecentSearchEntryDto,
} from '@healthbridge/shared-types';

const OPEN_SEARCH_EVENT = 'hb:global-search:open';
let mountedPrimarySearchInstances = 0;

interface GlobalSearchCommandProps {
  placeholder?: string;
  compact?: boolean;
}

type PaletteItem =
  | { kind: 'suggestion'; key: string; item: GlobalSearchSuggestionItemDto }
  | { kind: 'action'; key: string; action: RoleQuickAction }
  | { kind: 'recent-page'; key: string; page: RecentPageEntry }
  | { kind: 'recent-search'; key: string; entry: RecentSearchEntryDto }
  | { kind: 'full-search'; key: string; query: string };

function renderQuickActionIcon(icon: QuickActionIconKey) {
  const cls = 'w-3.5 h-3.5 shrink-0';
  switch (icon) {
    case 'calendar-plus':
      return <CalendarPlus className={cls} aria-hidden="true" />;
    case 'calendar':
      return <Calendar className={cls} aria-hidden="true" />;
    case 'file-heart':
      return <FileHeart className={cls} aria-hidden="true" />;
    case 'pill':
      return <Pill className={cls} aria-hidden="true" />;
    case 'flask':
      return <FlaskConical className={cls} aria-hidden="true" />;
    case 'shield-check':
      return <ShieldCheck className={cls} aria-hidden="true" />;
    case 'id-card':
      return <CreditCard className={cls} aria-hidden="true" />;
    case 'bar-chart':
      return <BarChart3 className={cls} aria-hidden="true" />;
    case 'settings':
      return <Settings className={cls} aria-hidden="true" />;
    case 'users':
      return <Users className={cls} aria-hidden="true" />;
    case 'stethoscope':
      return <Stethoscope className={cls} aria-hidden="true" />;
    case 'clipboard-plus':
      return <ClipboardPlus className={cls} aria-hidden="true" />;
    case 'clock':
      return <Clock className={cls} aria-hidden="true" />;
    case 'package':
      return <Package className={cls} aria-hidden="true" />;
    case 'alert-triangle':
      return <AlertTriangle className={cls} aria-hidden="true" />;
    case 'shopping-bag':
      return <ShoppingBag className={cls} aria-hidden="true" />;
    case 'plus-circle':
      return <PlusCircle className={cls} aria-hidden="true" />;
    case 'scan-barcode':
      return <ScanBarcode className={cls} aria-hidden="true" />;
    case 'test-tube':
      return <TestTube2 className={cls} aria-hidden="true" />;
    case 'file-check':
      return <FileCheck2 className={cls} aria-hidden="true" />;
    case 'beaker':
      return <Beaker className={cls} aria-hidden="true" />;
    case 'activity':
      return <Activity className={cls} aria-hidden="true" />;
    case 'lock':
      return <Lock className={cls} aria-hidden="true" />;
    case 'scroll-text':
      return <ScrollText className={cls} aria-hidden="true" />;
    case 'building':
      return <Building2 className={cls} aria-hidden="true" />;
    default:
      return <Zap className={cls} aria-hidden="true" />;
  }
}

export function GlobalSearchCommand({
  placeholder = 'Search records, doctors, prescriptions, orders...',
  compact = false,
}: GlobalSearchCommandProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { announce } = useLiveAnnouncer();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GlobalSearchSuggestionItemDto[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntryDto[]>([]);
  const [recentPages, setRecentPages] = useState<RecentPageEntry[]>([]);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track primary (non-compact) instances so Topbars with both desktop & mobile triggers share one modal
  useEffect(() => {
    if (compact || !isAuthenticated) return () => {};
    mountedPrimarySearchInstances += 1;
    const onExternalOpen = () => {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onExternalOpen);
    return () => {
      mountedPrimarySearchInstances = Math.max(0, mountedPrimarySearchInstances - 1);
      window.removeEventListener(OPEN_SEARCH_EVENT, onExternalOpen);
    };
  }, [compact, isAuthenticated]);

  // Privacy-safe recently visited page tracker (primary instance only, sessionStorage user-scoped)
  useEffect(() => {
    if (compact || !isAuthenticated || !userId || !pathname) return;
    const enabled = isSearchHistoryEnabled(userId);
    setHistoryEnabled(enabled);
    if (enabled) {
      const updated = recordRecentPage(userId, pathname);
      setRecentPages(updated);
    } else {
      setRecentPages([]);
    }
  }, [compact, isAuthenticated, userId, pathname]);

  // Reset modal state on user switch / logout
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setOpen(false);
      setQuery('');
      setSuggestions([]);
      setRecentSearches([]);
      setRecentPages([]);
      return;
    }
    setHistoryEnabled(isSearchHistoryEnabled(userId));
    setRecentPages(getRecentPages(userId));
  }, [isAuthenticated, userId]);

  const closeDialog = useCallback(() => {
    setOpen(false);
    const prev = previousFocusRef.current;
    if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
      window.setTimeout(() => prev.focus(), 20);
    }
  }, []);

  const openDialog = useCallback(() => {
    if (compact && mountedPrimarySearchInstances > 0) {
      window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
      return;
    }
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, [compact]);

  // Global Cmd+K / Ctrl+K shortcut (primary instance only to prevent duplicate dialogs)
  useEffect(() => {
    if (compact || !isAuthenticated) return () => {};
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            previousFocusRef.current = document.activeElement as HTMLElement | null;
          }
          return !prev;
        });
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        closeDialog();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [compact, isAuthenticated, open, closeDialog]);

  // Focus input & refresh recent history when opening dialog
  useEffect(() => {
    if (!open || !isAuthenticated || !userId) return () => {};
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30);

    const enabled = isSearchHistoryEnabled(userId);
    setHistoryEnabled(enabled);
    setRecentPages(enabled ? getRecentPages(userId) : []);

    if (!enabled) {
      setRecentSearches([]);
      return () => window.clearTimeout(focusTimer);
    }

    const controller = new AbortController();
    searchApi
      .getRecent(controller.signal)
      .then((res) => setRecentSearches(res.entries || []))
      .catch(() => {
        // Non-fatal
      });

    return () => {
      window.clearTimeout(focusTimer);
      controller.abort();
    };
  }, [open, isAuthenticated, userId]);

  // Debounced autocomplete suggestions with AbortController cancellation
  useEffect(() => {
    if (!open || !isAuthenticated) return () => {};
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return () => {};
    }

    const timer = window.setTimeout(() => {
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
          const items = res.suggestions || [];
          setSuggestions(items);
          setActiveIndex(0);
          announce(
            items.length > 0
              ? `${items.length} authorized search suggestions available.`
              : `No instant record suggestions for ${trimmed}.`
          );
        })
        .catch((err: unknown) => {
          const name = err instanceof Error ? err.name : '';
          if (name === 'CanceledError' || name === 'AbortError') return;
          setError(err);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, open, isAuthenticated, retryTick, announce]);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= 2;

  const matchedQuickActions = useMemo(
    () => filterQuickActions(userRole, trimmedQuery, isSearching ? 4 : 6),
    [userRole, trimmedQuery, isSearching]
  );

  const visibleRecentPages = useMemo(
    () => recentPages.filter((entry) => entry.path !== pathname).slice(0, 5),
    [recentPages, pathname]
  );

  // Unified flat list for seamless ArrowUp / ArrowDown / Enter keyboard navigation
  const paletteItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];
    if (isSearching) {
      for (const s of suggestions) {
        items.push({ kind: 'suggestion', key: `suggestion:${s.id}`, item: s });
      }
      for (const action of matchedQuickActions) {
        items.push({ kind: 'action', key: `action:${action.id}`, action });
      }
      items.push({ kind: 'full-search', key: 'full-search', query: trimmedQuery });
    } else {
      for (const action of matchedQuickActions) {
        items.push({ kind: 'action', key: `action:${action.id}`, action });
      }
      if (historyEnabled) {
        for (const page of visibleRecentPages) {
          items.push({ kind: 'recent-page', key: `page:${page.path}`, page });
        }
        for (const entry of recentSearches.slice(0, 5)) {
          items.push({ kind: 'recent-search', key: `recent:${entry.id}`, entry });
        }
      }
    }
    return items;
  }, [
    isSearching,
    suggestions,
    matchedQuickActions,
    trimmedQuery,
    historyEnabled,
    visibleRecentPages,
    recentSearches,
  ]);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (paletteItems.length === 0) return 0;
      return Math.min(prev, paletteItems.length - 1);
    });
  }, [paletteItems.length]);

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

  const executePaletteItem = useCallback(
    (item: PaletteItem) => {
      switch (item.kind) {
        case 'suggestion':
          navigateToRoute(item.item.destinationRoute);
          break;
        case 'action':
          navigateToRoute(item.action.href);
          break;
        case 'recent-page':
          navigateToRoute(item.page.path);
          break;
        case 'recent-search':
          navigateToSearchPage(item.entry.query);
          break;
        case 'full-search':
          navigateToSearchPage(item.query);
          break;
      }
    },
    [navigateToRoute, navigateToSearchPage]
  );

  const handleClearRecent = async () => {
    clearRecentPages(userId);
    setRecentPages([]);
    try {
      await searchApi.clearRecent();
      setRecentSearches([]);
      announce('Search and navigation history cleared.');
    } catch {
      setRecentSearches([]);
    }
  };

  const handleToggleHistory = async () => {
    if (!userId) return;
    const nextEnabled = !historyEnabled;
    setSearchHistoryEnabled(userId, nextEnabled);
    setHistoryEnabled(nextEnabled);
    if (!nextEnabled) {
      setRecentPages([]);
      setRecentSearches([]);
      try {
        await searchApi.clearRecent();
      } catch {
        // Non-fatal
      }
      announce('Search and recent page history paused and cleared.');
    } else {
      setRecentPages(getRecentPages(userId));
      announce('Search and recent page history enabled.');
    }
  };

  // Never render private search on unauthenticated pages
  if (!isAuthenticated || !user) {
    return null;
  }

  const indexMap = new Map<string, number>();
  paletteItems.forEach((item, idx) => indexMap.set(item.key, idx));
  const activeItem = paletteItems[activeIndex];
  const activeOptionId = activeItem ? `hb-search-opt-${activeIndex}` : undefined;

  const dialogContent = (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Global healthcare search and command palette"
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
        >
          <m.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeDialog}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
          />
          <m.div
            variants={modalEntrance}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-modal relative z-10 w-full max-w-2xl rounded-xl text-foreground overflow-hidden shadow-float"
          >
            {/* Command Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (activeItem) {
                  executePaletteItem(activeItem);
                } else {
                  navigateToSearchPage(query);
                }
              }}
              className="flex items-center gap-2.5 px-4 py-3 border-b border-border"
            >
              <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="hb-global-search-listbox"
                aria-activedescendant={activeOptionId}
                aria-autocomplete="list"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && paletteItems.length > 0) {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev + 1) % paletteItems.length);
                  } else if (e.key === 'ArrowUp' && paletteItems.length > 0) {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev - 1 + paletteItems.length) % paletteItems.length);
                  } else if (e.key === 'Enter' && paletteItems[activeIndex]) {
                    e.preventDefault();
                    executePaletteItem(paletteItems[activeIndex]);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeDialog();
                  }
                }}
                placeholder={placeholder}
                maxLength={100}
                aria-label="Search records or jump to workspace actions"
                className="flex-1 bg-transparent text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md focus-ring"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close global search"
                className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground focus-ring"
              >
                ESC
              </button>
            </form>

            {/* Palette Results & Smart Navigation List */}
            <div
              id="hb-global-search-listbox"
              role="listbox"
              aria-label="Search results and quick navigation"
              className="max-h-[65dvh] sm:max-h-[26rem] overflow-y-auto p-3 space-y-4 text-xs"
            >
              {isSearching ? (
                <>
                  {/* Authorized Record Suggestions */}
                  <div className="space-y-1.5">
                    <div className="px-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Authorized Records ({user.role})
                      </span>
                      {!loading && suggestions.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {suggestions.length} match{suggestions.length === 1 ? '' : 'es'}
                        </span>
                      )}
                    </div>

                    {loading ? (
                      <div className="space-y-1.5 px-1" aria-busy="true" aria-label="Loading search suggestions">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </div>
                    ) : error ? (
                      <ErrorState
                        compact
                        error={error}
                        title="Suggestions unavailable"
                        message="Live search suggestions could not be loaded. You can retry or run a full search."
                        onRetry={() => setRetryTick((t) => t + 1)}
                      />
                    ) : suggestions.length === 0 ? (
                      <div className="px-3 py-4 rounded-lg border border-dashed border-border text-center text-muted-foreground">
                        No instant record matches for &ldquo;{trimmedQuery}&rdquo;.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {suggestions.map((item) => {
                          const idx = indexMap.get(`suggestion:${item.id}`) ?? -1;
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={item.id}
                              id={`hb-search-opt-${idx}`}
                              role="option"
                              aria-selected={isActive}
                              type="button"
                              onMouseEnter={() => idx >= 0 && setActiveIndex(idx)}
                              onClick={() => navigateToRoute(item.destinationRoute)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors focus-ring ${
                                isActive
                                  ? 'bg-primary/10 text-foreground border border-primary/25'
                                  : 'hover:bg-muted/60 border border-transparent'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">
                                  <HighlightMatch text={item.title} query={trimmedQuery} />
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  <HighlightMatch text={item.subtitle} query={trimmedQuery} />
                                </div>
                              </div>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                                {item.resourceType.replace(/_/g, ' ')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Matching Role Quick Actions */}
                  {matchedQuickActions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-primary" aria-hidden="true" />
                        <span>Matching Quick Actions</span>
                      </div>
                      <div className="space-y-1">
                        {matchedQuickActions.map((action) => {
                          const idx = indexMap.get(`action:${action.id}`) ?? -1;
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={action.id}
                              id={`hb-search-opt-${idx}`}
                              role="option"
                              aria-selected={isActive}
                              type="button"
                              onMouseEnter={() => idx >= 0 && setActiveIndex(idx)}
                              onClick={() => navigateToRoute(action.href)}
                              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors focus-ring ${
                                isActive
                                  ? 'bg-primary/10 text-foreground border border-primary/25'
                                  : 'hover:bg-muted/60 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  {renderQuickActionIcon(action.icon)}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate">
                                    <HighlightMatch text={action.label} query={trimmedQuery} />
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    <HighlightMatch text={action.description} query={trimmedQuery} />
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                                {action.category}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Full Filtered Search Row */}
                  {(() => {
                    const idx = indexMap.get('full-search') ?? -1;
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        id={`hb-search-opt-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        type="button"
                        onMouseEnter={() => idx >= 0 && setActiveIndex(idx)}
                        onClick={() => navigateToSearchPage(trimmedQuery)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-colors focus-ring ${
                          isActive
                            ? 'bg-primary/10 text-primary border border-primary/25'
                            : 'bg-muted/40 hover:bg-muted/70 text-foreground border border-transparent'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 font-semibold truncate">
                          <Search className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            View all filtered results for &ldquo;{trimmedQuery}&rdquo;
                          </span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                      </button>
                    );
                  })()}
                </>
              ) : (
                <>
                  {/* Default State: Role Quick Actions */}
                  {matchedQuickActions.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-primary" aria-hidden="true" />
                        <span>Quick Actions ({user.role})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {matchedQuickActions.map((action) => {
                          const idx = indexMap.get(`action:${action.id}`) ?? -1;
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={action.id}
                              id={`hb-search-opt-${idx}`}
                              role="option"
                              aria-selected={isActive}
                              type="button"
                              onMouseEnter={() => idx >= 0 && setActiveIndex(idx)}
                              onClick={() => navigateToRoute(action.href)}
                              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-colors focus-ring ${
                                isActive
                                  ? 'bg-primary/10 text-foreground border border-primary/25'
                                  : 'hover:bg-muted/60 border border-border/50'
                              }`}
                            >
                              <span className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                {renderQuickActionIcon(action.icon)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-foreground truncate">
                                  {action.label}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {action.category}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recently Visited Workspace Pages */}
                  {historyEnabled && visibleRecentPages.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Compass className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                        <span>Recently Visited Pages</span>
                      </div>
                      <div className="space-y-1">
                        {visibleRecentPages.map((page) => {
                          const idx = indexMap.get(`page:${page.path}`) ?? -1;
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={page.path}
                              id={`hb-search-opt-${idx}`}
                              role="option"
                              aria-selected={isActive}
                              type="button"
                              onMouseEnter={() => idx >= 0 && setActiveIndex(idx)}
                              onClick={() => navigateToRoute(page.path)}
                              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors focus-ring ${
                                isActive
                                  ? 'bg-primary/10 text-foreground border border-primary/25'
                                  : 'hover:bg-muted/60 border border-transparent'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2 min-w-0">
                                <Compass className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                                <span className="font-medium text-foreground truncate">
                                  {page.label}
                                </span>
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {page.section}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Searches + Privacy Controls */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 px-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Recent Searches (Session Only)
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleToggleHistory}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground focus-ring rounded px-1 py-0.5"
                          title={
                            historyEnabled
                              ? 'Pause local page & search history display'
                              : 'Resume local page & search history display'
                          }
                        >
                          {historyEnabled ? (
                            <>
                              <EyeOff className="w-3 h-3" aria-hidden="true" />
                              <span>Pause history</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" aria-hidden="true" />
                              <span>Resume history</span>
                            </>
                          )}
                        </button>
                        {historyEnabled && (recentSearches.length > 0 || visibleRecentPages.length > 0) && (
                          <button
                            type="button"
                            onClick={handleClearRecent}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-error focus-ring rounded px-1 py-0.5"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {!historyEnabled ? (
                      <p className="px-3 py-3 rounded-lg bg-muted/40 text-center text-muted-foreground">
                        Session search and recent page history is paused for this workspace.
                      </p>
                    ) : recentSearches.length === 0 ? (
                      <p className="px-3 py-3 rounded-lg bg-muted/30 text-center text-muted-foreground">
                        Type at least 2 characters to search authorized {user.role.toLowerCase()} records or filter quick actions.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {recentSearches.slice(0, 5).map((entry) => {
                          const idx = indexMap.get(`recent:${entry.id}`) ?? -1;
                          const isActive = idx === activeIndex;
                          return (
                            <button
                              key={entry.id}
                              id={`hb-search-opt-${idx}`}
                              role="option"
                              aria-selected={isActive}
                              type="button"
                              onMouseEnter={() => idx >= 0 && setActiveIndex(idx)}
                              onClick={() => navigateToSearchPage(entry.query)}
                              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors focus-ring ${
                                isActive
                                  ? 'bg-primary/10 text-foreground border border-primary/25'
                                  : 'hover:bg-muted/60 border border-transparent'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2 text-foreground min-w-0">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                                <span className="truncate">{entry.query}</span>
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer: Keyboard Hints & Privacy Scope */}
            <div className="px-4 py-2.5 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="font-mono px-1 py-0.5 rounded border border-border bg-surface text-[10px]">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="font-mono px-1 py-0.5 rounded border border-border bg-surface text-[10px]">
                    <CornerDownLeft className="w-2.5 h-2.5 inline" aria-hidden="true" />
                  </kbd>
                  <span>Open</span>
                </span>
                <span className="truncate">
                  Role-scoped • No clinical values in previews
                </span>
              </div>
              {trimmedQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigateToSearchPage(trimmedQuery)}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline focus-ring rounded"
                >
                  <span>Full Search</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Topbar Trigger */}
      {compact ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={openDialog}
          aria-label="Open global search and command palette"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-ring"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={openDialog}
          aria-label="Open global search and command palette"
          className="group relative w-full flex items-center gap-2 pl-3 pr-12 py-2 text-xs rounded-md border border-border bg-muted/40 text-muted-foreground hover:bg-muted/75 hover:border-primary/30 hover:text-foreground transition-all duration-150 text-left focus-ring"
        >
          <Search className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:scale-105" aria-hidden="true" />
          <span className="truncate">{placeholder}</span>
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded-sm border border-border bg-surface shadow-xs">
            ⌘K
          </kbd>
        </button>
      )}

      {/* Portal-rendered Command Palette so mobile/desktop wrappers never clip or hide it */}
      {mounted && typeof document !== 'undefined' ? createPortal(dialogContent, document.body) : null}
    </>
  );
}
