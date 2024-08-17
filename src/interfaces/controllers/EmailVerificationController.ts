import { Request, Response } from 'express';
import { emailVerificationSchema } from '../../validators/authValidators';
import SendVerificationEmailUseCase from '../../application/usecases/SendVerificationEmailUseCase';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';

class EmailVerificationController {
  private sendVerificationEmailUseCase =
    container.get<SendVerificationEmailUseCase>(
      TYPES.SendVerificationEmailUseCase
    );

  public sendVerificationEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email } = req.body;

    try {
      // Validate the email
      emailVerificationSchema.parse({ email });

      // Execute the use case
      await this.sendVerificationEmailUseCase.execute({ email });

      return res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'A valid token already exists.') {
          return res.status(409).json({ message: error.message });
        } else if (error.message === 'User already exists.') {
          return res.status(409).json({ message: error.message });
        } else {
          console.error('Error sending verification email:', error);
          return res.status(500).json({ message: 'Internal server error' });
        }
      } else {
        console.error('Unknown server error:', error);
        return res.status(400).json({ message: 'Unknown server error' });
      }
    }
  };
}

export default new EmailVerificationController();
