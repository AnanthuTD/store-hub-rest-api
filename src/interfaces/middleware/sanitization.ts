import { Request, Response, NextFunction } from 'express';
import { escape } from 'validator';

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  console.log(req.body);
  if (req.body) {
    req.body.password = escape(req.body.password);
  }
  next();
}
