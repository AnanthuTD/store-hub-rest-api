import { Request, Response } from 'express';
import { TokenService } from '../../../infrastructure/services/TokenService';
import logger from '../../../infrastructure/utils/logger';
import { setAuthTokenInCookies } from '../../../infrastructure/auth/setAuthTokenInCookies';

class CredentialAuthController {
  async handle(req: Request, res: Response) {
    try {
      const { user } = req;
      const token = TokenService.generateToken(user.id);

      setAuthTokenInCookies(token, res);

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
