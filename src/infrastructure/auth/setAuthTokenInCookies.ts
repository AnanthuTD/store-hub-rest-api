import { Response } from 'express';
import env from '../env/env';

export function setAuthTokenInCookies(token: string, res: Response) {
  res.cookie('authToken', token, {
    httpOnly: false,
    secure: env.isProduction,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: env.isDevelopment ? 'strict' : 'none',
  });
}
