import { Request, Response } from 'express';
import { container } from '../../../../config/inversify.config';
import { ISignUpShopOwnerUseCase } from '../../../../application/usecases/SignUpShopOwnerUseCase';
import { TYPES } from '../../../../config/types';
import EmailService from '../../../../infrastructure/services/EmailService';
import { v4 as uuidv4 } from 'uuid';
import { IVerificationTokenRepository } from '../../../../domain/repositories/IVerificationTokenRepository';
import { convertRelativeTimeToDate } from '../../../../infrastructure/utils/TimeUtils';
import env from '../../../../infrastructure/env/env';
import generateEmailTemplate, {
  EmailProcess,
} from '../../../../infrastructure/utils/emailTemplateGenerator';

export const signUpShopOwner = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email, password } = req.body;

  try {
    const signUpUseCase = container.get<ISignUpShopOwnerUseCase>(
      TYPES.ISignUpShopOwnerUseCase
    );
    const tokenRepository = container.get<IVerificationTokenRepository>(
      TYPES.VerificationTokenRepository
    );
    const emailService = container.get<EmailService>(TYPES.EmailService);

    await signUpUseCase.execute(email, password);

    const token = uuidv4();
    const expirationDate = convertRelativeTimeToDate(
      env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_TIME
    );

    await tokenRepository.createToken({
      email,
      token,
      expiresAt: expirationDate,
    });

    const callback = `${env.FRONTEND_BASE_URL}/vendor/signin`;

    const verificationLink = `${req.protocol}://${req.get('host')}/api/vendor/auth/verify-email?token=${token}&callbackUrl=${callback}&email=${email}`;

    await emailService.sendVerificationEmail({
      to: email,
      subject: 'Email verification shopHub',
      html: generateEmailTemplate({
        process: EmailProcess.SIGNUP_VERIFICATION,
        props: { name: email, role: 'shopOwner', verificationLink },
      }),
    });

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: (error as Error).message });
  }
};
