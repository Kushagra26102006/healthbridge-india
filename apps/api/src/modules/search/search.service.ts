/**
 * HealthBridge India — Global Search Orchestration Service (Day 8 Task 02)
 *
 * Responsibilities:
 *   1. Enforce centralized role-based search permission matrix (fail-closed).
 *   2. Execute bounded read-only cross-module searches via SearchRepository.
 *   3. Deduplicate, rank, sort, group-count, and paginate results.
 *   4. Maintain privacy-first SESSION-MEMORY-ONLY recent searches (never persisted to MongoDB,
 *      automatically skips sensitive health terms / identifiers / credentials, instant clear).
 *   5. Emit operational-only audit and slow-query metrics (NEVER logs raw query strings or PHI).
 */

import { randomUUID } from 'crypto';
import type {
  GlobalSearchCategoryGroup,
  GlobalSearchResourceType,
  GlobalSearchResponseDto,
  GlobalSearchResultItemDto,
  GlobalSearchSortField,
  GlobalSearchSortOrder,
  GlobalSearchSuggestionItemDto,
  GlobalSearchSuggestionsResponseDto,
  RecentSearchEntryDto,
  UserRole,
} from '@healthbridge/shared-types';
import { AppError } from '../../shared/errors/app-error';
import { AuditLogModel } from '../security/models/audit-log.model';
import { logger } from '../../utils/logger';
import {
  getAllowedSearchTypesForRole,
  resolveAuthorizedSearchTypes,
} from './search.permissions';
import {
  isSensitiveHistoryQuery,
  sanitizeSearchQuery,
} from './search.validation';
import { searchRepository, SearchRepository } from './search.repository';

const MAX_RECENT_SEARCHES_PER_USER = 10;
const RECENT_SEARCH_TTL_MS = 30 * 60 * 1000; // 30 minutes ephemeral TTL
const SLOW_QUERY_THRESHOLD_MS = 500;

export interface SearchExecutionInput {
  q: string;
  types?: GlobalSearchResourceType[];
  page: number;
  limit: number;
  sortBy: GlobalSearchSortField;
  sortOrder: GlobalSearchSortOrder;
  from?: string;
  to?: string;
  status?: string;
  category?: string;
}

export interface SearchActorIdentity {
  userId: string;
  role: UserRole;
}

interface StoredRecentSearch extends RecentSearchEntryDto {
  expiresAtMs: number;
}

export class GlobalSearchService {
  private readonly recentSearchesByUser = new Map<string, StoredRecentSearch[]>();

  constructor(private readonly repository: SearchRepository = searchRepository) {}

  private pruneAndGetRecent(userId: string): StoredRecentSearch[] {
    const now = Date.now();
    const existing = this.recentSearchesByUser.get(userId) || [];
    const active = existing.filter((entry) => entry.expiresAtMs > now);
    if (active.length === 0) {
      this.recentSearchesByUser.delete(userId);
    } else if (active.length !== existing.length) {
      this.recentSearchesByUser.set(userId, active);
    }
    return active;
  }

  private recordRecentSearch(
    userId: string,
    cleanQuery: string,
    types: GlobalSearchResourceType[]
  ): void {
    if (!userId || cleanQuery.length < 2) return;
    if (isSensitiveHistoryQuery(cleanQuery)) {
      return;
    }

    const active = this.pruneAndGetRecent(userId);
    const normalized = cleanQuery.toLowerCase();
    const filtered = active.filter((item) => item.query.toLowerCase() !== normalized);

    const entry: StoredRecentSearch = {
      id: randomUUID(),
      query: cleanQuery,
      types: types.slice(0, 5),
      timestamp: new Date().toISOString(),
      storagePolicy: 'SESSION_MEMORY_ONLY',
      expiresAtMs: Date.now() + RECENT_SEARCH_TTL_MS,
    };

    const next = [entry, ...filtered].slice(0, MAX_RECENT_SEARCHES_PER_USER);
    this.recentSearchesByUser.set(userId, next);
  }

  getRecentSearches(userId: string): RecentSearchEntryDto[] {
    return this.pruneAndGetRecent(userId).map(({ expiresAtMs: _ignore, ...dto }) => dto);
  }

  clearRecentSearches(userId: string): { clearedCount: number } {
    const existing = this.recentSearchesByUser.get(userId);
    const clearedCount = existing ? existing.length : 0;
    this.recentSearchesByUser.delete(userId);
    return { clearedCount };
  }

  private sortResults(
    items: GlobalSearchResultItemDto[],
    sortBy: GlobalSearchSortField,
    sortOrder: GlobalSearchSortOrder
  ): GlobalSearchResultItemDto[] {
    const dir = sortOrder === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      if (sortBy === 'title') {
        const cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        if (cmp !== 0) return cmp * dir;
        return b.score - a.score;
      }

      if (sortBy === 'date') {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        if (timeA !== timeB) return (timeA - timeB) * dir;
        return b.score - a.score;
      }

      // Default: relevance
      if (a.score !== b.score) {
        return (a.score - b.score) * dir;
      }
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    });
  }

  private deduplicateResults(items: GlobalSearchResultItemDto[]): GlobalSearchResultItemDto[] {
    const seen = new Map<string, GlobalSearchResultItemDto>();
    for (const item of items) {
      const key = `${item.resourceType}:${item.id}`;
      const prev = seen.get(key);
      if (!prev || item.score > prev.score) {
        seen.set(key, item);
      }
    }
    return Array.from(seen.values());
  }

  async executeGlobalSearch(
    actor: SearchActorIdentity,
    input: SearchExecutionInput,
    requestId?: string
  ): Promise<GlobalSearchResponseDto> {
    const startedAt = Date.now();
    const cleanQuery = sanitizeSearchQuery(input.q);
    if (!cleanQuery) {
      throw AppError.badRequest('Search query cannot be empty.');
    }

    const allowedTypes = getAllowedSearchTypesForRole(actor.role);
    const authorizedTypes = resolveAuthorizedSearchTypes(actor.role, input.types);

    const fromDate = input.from ? new Date(input.from) : undefined;
    const toDate = input.to ? new Date(input.to) : undefined;
    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw AppError.badRequest('Filter "from" date cannot be after "to" date.');
    }

    const actorContext = await this.repository.resolveActorScope(actor.userId, actor.role);

    const filter = {
      query: cleanQuery,
      from: fromDate,
      to: toDate,
      status: input.status?.trim() || undefined,
      category: input.category?.trim() || undefined,
    };

    const rawBuckets = await Promise.all(
      authorizedTypes.map((type) => this.repository.searchByType(type, actorContext, filter))
    );

    const merged = this.deduplicateResults(rawBuckets.flat());

    const groupedCounts: Partial<Record<GlobalSearchCategoryGroup, number>> = {};
    const typeCounts: Partial<Record<GlobalSearchResourceType, number>> = {};

    for (const item of merged) {
      groupedCounts[item.categoryGroup] = (groupedCounts[item.categoryGroup] || 0) + 1;
      typeCounts[item.resourceType] = (typeCounts[item.resourceType] || 0) + 1;
    }

    const sorted = this.sortResults(merged, input.sortBy, input.sortOrder);

    const total = sorted.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / input.limit);
    const startIdx = (input.page - 1) * input.limit;
    const paginatedResults = sorted.slice(startIdx, startIdx + input.limit);

    this.recordRecentSearch(actor.userId, cleanQuery, authorizedTypes);

    const executionTimeMs = Date.now() - startedAt;

    // Operational-only slow-query telemetry (NEVER log raw query string or patient data)
    if (executionTimeMs >= SLOW_QUERY_THRESHOLD_MS) {
      logger.warn('Slow global search execution detected', {
        requestId,
        role: actor.role,
        targetTypesCount: authorizedTypes.length,
        queryLength: cleanQuery.length,
        resultCount: total,
        executionTimeMs,
      });
    }

    // Operational-only audit event (NEVER log raw query text or clinical PII)
    await AuditLogModel.create({
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'GLOBAL_SEARCH_EXECUTED',
      resourceType: 'GLOBAL_SEARCH',
      resourceId: requestId || 'global-search',
      timestamp: new Date(),
      outcome: 'SUCCESS',
      metadata: {
        targetTypes: authorizedTypes,
        queryLength: cleanQuery.length,
        resultCount: total,
        page: input.page,
        limit: input.limit,
        sortBy: input.sortBy,
        executionTimeMs,
      },
    }).catch(() => undefined);

    return {
      query: cleanQuery,
      results: paginatedResults,
      groupedCounts,
      typeCounts,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages,
        hasNext: totalPages > 0 && input.page < totalPages,
        hasPrev: input.page > 1 && totalPages > 0,
      },
      appliedFilters: {
        types: authorizedTypes,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
        from: input.from,
        to: input.to,
        status: filter.status,
        category: filter.category,
      },
      allowedTypes,
      executionTimeMs,
    };
  }

  async getSuggestions(
    actor: SearchActorIdentity,
    rawQuery: string,
    limit: number
  ): Promise<GlobalSearchSuggestionsResponseDto> {
    const cleanQuery = sanitizeSearchQuery(rawQuery);
    const allowedTypes = getAllowedSearchTypesForRole(actor.role);

    if (cleanQuery.length < 2) {
      return {
        query: cleanQuery,
        suggestions: [],
        allowedTypes,
      };
    }

    const qLower = cleanQuery.toLowerCase();

    // 1. Matching user-scoped ephemeral recent searches (up to 3)
    const recentMatches: GlobalSearchSuggestionItemDto[] = this.getRecentSearches(actor.userId)
      .filter((entry) => entry.query.toLowerCase().includes(qLower))
      .slice(0, 3)
      .map((entry) => ({
        id: `recent:${entry.id}`,
        resourceType: 'recent' as const,
        categoryGroup: 'RECENT' as const,
        title: entry.query,
        subtitle: 'Recent search (session only)',
        destinationRoute: `/dashboard/search?q=${encodeURIComponent(entry.query)}`,
        isRecent: true,
      }));

    // 2. Live authorized resource suggestions obeying the exact same role & tenant scope
    const remainingSlots = Math.max(0, limit - recentMatches.length);
    if (remainingSlots === 0 || allowedTypes.length === 0) {
      return {
        query: cleanQuery,
        suggestions: recentMatches.slice(0, limit),
        allowedTypes,
      };
    }

    const actorContext = await this.repository.resolveActorScope(actor.userId, actor.role);
    const buckets = await Promise.all(
      allowedTypes.map((type) =>
        this.repository.searchByType(type, actorContext, { query: cleanQuery })
      )
    );

    const rankedResources = this.sortResults(
      this.deduplicateResults(buckets.flat()),
      'relevance',
      'desc'
    ).slice(0, remainingSlots);

    const resourceSuggestions: GlobalSearchSuggestionItemDto[] = rankedResources.map((item) => ({
      id: `${item.resourceType}:${item.id}`,
      resourceType: item.resourceType,
      categoryGroup: item.categoryGroup,
      title: item.title,
      subtitle: item.description,
      destinationRoute: item.destinationRoute,
      isRecent: false,
    }));

    return {
      query: cleanQuery,
      suggestions: [...recentMatches, ...resourceSuggestions].slice(0, limit),
      allowedTypes,
    };
  }
}

export const globalSearchService = new GlobalSearchService();
