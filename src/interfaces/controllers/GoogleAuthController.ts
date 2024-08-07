import { Request, Response } from 'express';
import { IUser } from '../../domain/entities/User';
import TokenService from '../../infrastructure/services/TokenService';

class GoogleAuthController {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      if (!user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      const token = TokenService.generateToken(user.id);

      res.redirect(`/profile?token=${token}`);
    } catch (error) {
      console.error('Error handling Google authentication:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new GoogleAuthController();
