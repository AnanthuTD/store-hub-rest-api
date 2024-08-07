import { Request, Response, NextFunction } from 'express';
import { escape, normalizeEmail } from 'validator';

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  console.log(req.body);
  if (req.body) {
    req.body.email = normalizeEmail(req.body.email);
    req.body.password = escape(req.body.password);
  }
  next();
}
