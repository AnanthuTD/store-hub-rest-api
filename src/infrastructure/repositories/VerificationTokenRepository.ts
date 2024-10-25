import { injectable } from 'inversify';
import { IToken } from '../../domain/entities/Token';
import { IVerificationTokenRepository } from '../../domain/repositories/IVerificationTokenRepository';
import TokenModel from '../database/models/TokenModel';

@injectable()
class VerificationTokenRepository implements IVerificationTokenRepository {
  async createToken({ email, expiresAt, token }: IToken): Promise<null> {
    try {
      const tokenInstance = new TokenModel({ email, expiresAt, token });
      await tokenInstance.save();
    } catch (error) {
      console.error('Error creating token:', error);
    }
    return null;
  }

  async findToken(token: string): Promise<IToken | null> {
    return await TokenModel.findOne({ token });
  }

  async removeToken(token: string): Promise<null> {
    await TokenModel.deleteOne({ token });
    return null;
  }

  async removeTokenWithEmail(email: string): Promise<null> {
    await TokenModel.deleteOne({ email });
    return null;
  }

  async updateOrCreateToken({
    email,
    token,
    expiresAt,
  }: IToken): Promise<null> {
    TokenModel.updateOne({ email }, { token, expiresAt }, { upsert: true });
    return null;
  }
}

export default VerificationTokenRepository;
