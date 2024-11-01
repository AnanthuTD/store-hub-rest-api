import { Response } from 'express';
import env from '../env/env';

export function setAuthTokenInCookies(token: string, res: Response) {
  console.log(`setAuthTokenInCookies`, token);
  console.log('isProduction: ', env.isProduction);
  console.log('isDevelopment: ', env.isDevelopment);

  res.cookie('authToken', token, {
    httpOnly: false,
    secure: env.isProduction,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: env.isDevelopment ? 'strict' : 'none',
  });
}
