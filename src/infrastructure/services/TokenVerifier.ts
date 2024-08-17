import dayjs from 'dayjs';
import { ITokenVerifier } from '../../domain/services/ITokenVerifier';
import { injectable } from 'inversify';
import VerificationTokenRepository from '../repositories/VerificationTokenRepository';

@injectable()
class TokenVerifier implements ITokenVerifier {
  private verificationTokenRepo = new VerificationTokenRepository();

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

export default TokenVerifier;
