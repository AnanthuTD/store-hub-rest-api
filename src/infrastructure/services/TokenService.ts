import jwt from 'jsonwebtoken';
import env from '../env/env';

export class TokenService {
  public static generateToken(
    userId: string,
    secret = env.JWT_SECRET,
    profile = {}
  ): string {
    return jwt.sign({ id: userId, profile }, secret, {
      expiresIn: '30d',
    });
  }

  public static verifyToken = async (
    token: string,
    secret: string = env.JWT_SECRET
  ): Promise<{ valid: boolean; id?: string; message: string }> => {
    try {
      const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

      return {
        valid: true,
        id: decoded.id,
        message: 'Token is valid',
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          message: 'Token has expired',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          message: 'Token is invalid',
        };
      }

      return {
        valid: false,
        message: 'Token verification failed',
      };
    }
  };
}

export default TokenService;
