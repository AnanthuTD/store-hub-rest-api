import { IToken } from '../../domain/entities/Token';

export interface IVerificationTokenRepository {
  createToken(tokenData: IToken): Promise<null>;
  findToken(token: string): Promise<IToken>;
  removeToken(token: string): Promise<null>;
}
