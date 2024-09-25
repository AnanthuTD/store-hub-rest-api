import jwt from 'jsonwebtoken';
import env from '../env/env';

export class TokenService {
  public static generateToken(userId: string): string {
    return jwt.sign({ id: userId }, env.JWT_SECRET!, {
      expiresIn: '30d',
    });
  }
}

export default TokenService;
