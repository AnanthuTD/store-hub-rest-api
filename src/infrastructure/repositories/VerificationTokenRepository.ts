import { IVerificationTokenRepository } from '../../application/interfaces/IVerificationTokenRepository';
import { IToken } from '../../domain/entities/Token';
import TokenModel from '../database/models/TokenModel';

class VerificationTokenRepository implements IVerificationTokenRepository {
  async createToken({ email, expiresAt, token }: IToken): Promise<null> {
    const tokenInstance = new TokenModel({ email, expiresAt, token });
    tokenInstance.save();
    return null;
  }

  async findToken(token: string): Promise<IToken> {
    return await TokenModel.findOne({ token });
  }

  async removeToken(token: string): Promise<null> {
    await TokenModel.deleteOne({ token });
    return null;
  }
}

export default VerificationTokenRepository;
