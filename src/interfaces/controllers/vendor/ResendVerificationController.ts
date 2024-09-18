import { Request, Response } from 'express';
import { container } from '../../../config/inversify.config';
import { TYPES } from '../../../config/types';
import { ResendVerificationTokenUseCase } from '../../../application/usecases/ResendVerificationTokenUseCase';
import env from '../../../infrastructure/env/env';

export const resendVerificationTokenController = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  try {
    const resendTokenUseCase = container.get<ResendVerificationTokenUseCase>(
      TYPES.ResendVerificationTokenUseCase
    );

    const response = await resendTokenUseCase.execute(
      email,
      `${req.protocol}://${req.get('host')}/shopOwner/verify-email`
    );

    return res
      .status(response.statusCode)
      .redirect(
        `${env.FRONTEND_BASE_URL}/token-verification-status?message=${response.message}`
      );
  } catch (error) {
    console.error('Error resending verification token:', error);
    return res
      .status(500)
      .redirect(
        `${env.FRONTEND_BASE_URL}/token-verification-status?message=Internal server error. Please try again later`
      );
  }
};
