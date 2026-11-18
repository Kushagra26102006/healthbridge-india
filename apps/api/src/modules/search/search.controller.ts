/**
 * HealthBridge India — Global Search HTTP Controller (Day 8 Task 02)
 */

import { Request, Response } from 'express';
import {
  globalSearchQuerySchema,
  globalSearchSuggestionsQuerySchema,
} from '@healthbridge/validation';
import { asyncHandler } from '../../utils/async-handler';
import { sendSuccess } from '../../utils/api-response';
import { globalSearchService } from './search.service';

export class SearchController {
  /**
   * GET /api/v1/search
   * Role-scoped global search across authorized platform modules.
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const parsed = globalSearchQuerySchema.parse(req.query);
    const requestId = (req as any).id || (req.headers['x-request-id'] as string | undefined);

    const result = await globalSearchService.executeGlobalSearch(
      {
        userId: req.user!.userId,
        role: req.user!.role,
      },
      parsed,
      requestId
    );

    sendSuccess(res, result, 'Global search completed successfully');
  });

  /**
   * GET /api/v1/search/suggestions
   * Fast autocomplete suggestions obeying the exact same role & tenant permissions.
   */
  suggestions = asyncHandler(async (req: Request, res: Response) => {
    const parsed = globalSearchSuggestionsQuerySchema.parse(req.query);

    const result = await globalSearchService.getSuggestions(
      {
        userId: req.user!.userId,
        role: req.user!.role,
      },
      parsed.q,
      parsed.limit
    );

    sendSuccess(res, result, 'Search suggestions retrieved successfully');
  });

  /**
   * GET /api/v1/search/recent
   * Returns ephemeral session-memory recent searches scoped to the authenticated user.
   */
  recent = asyncHandler(async (req: Request, res: Response) => {
    const entries = globalSearchService.getRecentSearches(req.user!.userId);
    sendSuccess(
      res,
      {
        entries,
        storagePolicy: 'SESSION_MEMORY_ONLY',
      },
      'Recent searches retrieved successfully'
    );
  });

  /**
   * DELETE /api/v1/search/recent
   * Immediately wipes ephemeral recent search history for the authenticated user.
   */
  clearRecent = asyncHandler(async (req: Request, res: Response) => {
    const outcome = globalSearchService.clearRecentSearches(req.user!.userId);
    sendSuccess(res, outcome, 'Recent search history cleared');
  });
}

export const searchController = new SearchController();
