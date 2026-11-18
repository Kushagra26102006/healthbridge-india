import { Router, Request, Response, NextFunction } from 'express';
import {
  assistantService,
  assistantChatRequestSchema,
  type AssistantRole,
} from '../services/assistant.service';
import { tokenService } from '../../auth/services/token.service';
import { sendSuccess } from '../../../utils/api-response';
import { HttpStatus } from '../../../shared/constants/http-status';

const VALID_ROLES = new Set<AssistantRole>([
  'PATIENT',
  'DOCTOR',
  'PHARMACY',
  'LABORATORY',
  'ADMIN',
]);

function resolveOptionalRole(req: Request): AssistantRole {
  try {
    const authHeader = req.headers.authorization;
    const bearer =
      authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const cookieToken =
      typeof req.cookies?.accessToken === 'string' ? req.cookies.accessToken : null;
    const rawToken = bearer || cookieToken;
    if (!rawToken) return 'PUBLIC';

    const decoded = tokenService.verifyAccessToken(rawToken);
    const candidate = String(decoded.role || '').toUpperCase() as AssistantRole;
    return VALID_ROLES.has(candidate) ? candidate : 'PUBLIC';
  } catch {
    return 'PUBLIC';
  }
}

export const assistantRoutes = Router();

/**
 * @route   POST /api/v1/assistant/chat
 * @desc    Healthcare-safe, RBAC-aware platform navigation & guidance assistant
 * @access  Public / Optional Auth (strictly role-scoped; never logs PHI or messages)
 */
assistantRoutes.post('/chat', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = assistantChatRequestSchema.parse(req.body);
    const role = resolveOptionalRole(req);
    const result = assistantService.respond(parsed.message, role);
    sendSuccess(res, result, 'Assistant response generated', HttpStatus.OK);
  } catch (error) {
    next(error);
  }
});

export default assistantRoutes;
