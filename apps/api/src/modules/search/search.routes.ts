/**
 * HealthBridge India — Global Search Routes (Day 8 Task 02)
 *
 * All search endpoints require strict JWT authentication and apply a dedicated
 * per-user search rate limiter to prevent enumeration, scraping, or DoS bursts.
 */

import { Router, Request } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { createRateLimiter } from '../../middleware/rate-limit';
import { searchController } from './search.controller';

export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute sliding window
  max: 90, // 90 searches/suggestions per minute per authenticated user
  message: 'Search rate limit exceeded. Please wait briefly before searching again.',
  keyGenerator: (req: Request) => {
    if (req.user?.userId) {
      return `search:user:${req.user.userId}`;
    }
    return `search:ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  },
});

export const searchRoutes = Router();

// Strictly authenticated — anonymous/unauthenticated global search is prohibited
searchRoutes.use(authenticate);
searchRoutes.use(searchRateLimiter);

searchRoutes.get('/', searchController.search);
searchRoutes.get('/suggestions', searchController.suggestions);
searchRoutes.get('/recent', searchController.recent);
searchRoutes.delete('/recent', searchController.clearRecent);

export default searchRoutes;
