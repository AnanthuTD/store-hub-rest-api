import { Request, Response } from 'express';
import { IUser } from '../../domain/entities/User';
import TokenService from '../../infrastructure/services/TokenService';
import logger from '../../infrastructure/utils/logger';
import env from '../../infrastructure/env/env';

class GoogleAuthController {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Generate a token
      const token = TokenService.generateToken(user.id!);

      // Redirect user to the profile page
      res.redirect(
        env.FRONTEND_BASE_URL + env.FRONTEND_USER_HOME + '?token=' + token
      );
    } catch (error) {
      logger.error('Error handling Google authentication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default GoogleAuthController;
