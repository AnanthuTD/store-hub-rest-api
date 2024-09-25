import { Request, Response } from 'express';
import { TokenService } from '../../../infrastructure/services/TokenService';
import env from '../../../infrastructure/env/env';
import logger from '../../../infrastructure/utils/logger';

class CredentialAuthController {
  async handle(req: Request, res: Response) {
    try {
      const { user } = req;
      const token = TokenService.generateToken(user.id);

      res.cookie('authToken', token, {
        httpOnly: false,
        secure: env.isProduction,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      });

      res.json({ user });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error generating token:', error.message);
      } else {
        logger.error('Error generating token:', 'Unknown error');
      }

      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default CredentialAuthController;
