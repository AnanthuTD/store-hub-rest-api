import { Request, Response } from 'express';
import { IUser } from '../../domain/entities/User';
import TokenService from '../../infrastructure/services/TokenService';
import logger from '../../infrastructure/utils/Logger';
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
      const token = TokenService.generateToken(user.id);

      // Set token in an HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: env.isProduction,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'strict',
      });

      // Redirect user to the profile page
      res.redirect('http://localhost:5173/home');
    } catch (error) {
      logger.error('Error handling Google authentication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new GoogleAuthController();
