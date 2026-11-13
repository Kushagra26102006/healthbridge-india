import { Request, Response, NextFunction } from 'express';

export type AsyncRequestHandler<T = unknown> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;

/**
 * Wraps asynchronous Express route handlers to automatically catch rejections
 * and forward them to next() error handling middleware.
 */
export const asyncHandler = <T = unknown>(fn: AsyncRequestHandler<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
