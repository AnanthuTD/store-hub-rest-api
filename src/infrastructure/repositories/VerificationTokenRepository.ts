import { injectable } from 'inversify';
import { IToken } from '../../domain/entities/Token';
import { IVerificationTokenRepository } from '../../domain/repositories/IVerificationTokenRepository';
import TokenModel from '../database/models/TokenModel';

@injectable()
class VerificationTokenRepository implements IVerificationTokenRepository {
  async createToken({ email, expiresAt, token }: IToken): Promise<null> {
    const tokenInstance = new TokenModel({ email, expiresAt, token });
    tokenInstance.save();
    return null;
  }

  async findToken(token: string): Promise<IToken | null> {
    return await TokenModel.findOne({ token });
  }

  async removeToken(token: string): Promise<null> {
    await TokenModel.deleteOne({ token });
    return null;
  }
}

export default VerificationTokenRepository;
