import { IToken } from '../../domain/entities/Token';

export interface IVerificationTokenRepository {
  createToken(tokenData: IToken): Promise<null>;
  findToken(token: string): Promise<IToken | null>;
  removeToken(token: string): Promise<null>;
  removeTokenWithEmail(email: string): Promise<null>;
  updateOrCreateToken(tokenData: IToken): Promise<null>;
}
