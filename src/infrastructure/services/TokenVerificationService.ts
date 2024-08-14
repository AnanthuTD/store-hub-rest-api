import { IVerificationTokenRepository } from '../../application/interfaces/IVerificationTokenRepository';
import dayjs from 'dayjs';

class TokenVerificationService {
  private verificationTokenRepo: IVerificationTokenRepository;

  constructor(verificationTokenRepo: IVerificationTokenRepository) {
    this.verificationTokenRepo = verificationTokenRepo;
  }

  public verifyToken = async (
    token: string
  ): Promise<{ valid: boolean; email?: string; message: string }> => {
    const tokenInstance = await this.verificationTokenRepo.findToken(token);

    if (!tokenInstance) {
      return { valid: false, message: 'Token not found' };
    }

    const { email, expiresAt } = tokenInstance;

    if (dayjs(expiresAt).isAfter(dayjs())) {
      return { valid: true, email, message: 'Token is valid' };
    } else {
      return { valid: false, message: 'Token has expired' };
    }
  };
}

export default TokenVerificationService;
