import { Request, Response } from 'express';
import { IShopOwner } from '../../../domain/entities/IShopOwner';
import TokenService from '../../../infrastructure/services/TokenService';
import env from '../../../infrastructure/env/env';
import logger from '../../../infrastructure/utils/logger';

export async function googleAuthController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const shopOwner = req.user as IShopOwner;
    if (!shopOwner) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Generate a token
    const token = TokenService.generateToken(shopOwner._id!);

    // Redirect user to the profile page
    res.redirect(`${env.FRONTEND_BASE_URL}/shop/dashboard?token=${token}`);
  } catch (error) {
    logger.error('Error handling Google authentication:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}