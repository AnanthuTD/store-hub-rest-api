import { Request, Response, NextFunction } from 'express';
import logger from '../../infrastructure/utils/logger';

const extractJwtFromCookie = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies['authToken'];

    if (token) {
      req.headers['authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    logger.error('Error extracting JWT from cookie:', error);
  }

  next();
};

export default extractJwtFromCookie;
