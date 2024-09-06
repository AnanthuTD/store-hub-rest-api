import { Request, Response } from 'express';
import { container } from '../../../config/inversify.config';
import { TYPES } from '../../../config/types';
import TokenVerifier from '../../../infrastructure/services/TokenVerifier';
import env from '../../../infrastructure/env/env';
import { ShopOwnerRepository } from '../../../infrastructure/repositories/ShopOwnerRepository';

export const verifyTokenController = async (req: Request, res: Response) => {
  const { token, callbackUrl, email } = req.query;

  try {
    // Instantiate the token verifier
    const tokenVerifier = container.get<TokenVerifier>(TYPES.TokenVerifier);

    // Verify the token
    const { valid, message } = await tokenVerifier.verifyToken(token as string);

    if (valid) {
      if (await new ShopOwnerRepository().setVerified(email as string)) {
        // If token is valid, redirect to the callback URL
        return res.redirect(callbackUrl as string);
      } else res.status(400).json({ message: 'Invalid email address!' });
    } else {
      // If token is invalid, render an error page with details and next steps
      return res
        .status(400)
        .redirect(
          `${env.FRONTEND_BASE_URL}/token-verification-status?message=${message}&email=${email}`
        );
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Error verifying token:', error);
    return res
      .status(500)
      .redirect(
        `${env.FRONTEND_BASE_URL}/token-verification-status?email=${email}&message=internal server error`
      );
  }
};
