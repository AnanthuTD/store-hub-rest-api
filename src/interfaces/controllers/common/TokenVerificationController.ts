import { Request, Response } from 'express';
import TokenVerificationService from '../../../infrastructure/services/TokenVerifier';

class TokenVerificationController {
  private tokenVerificationService = new TokenVerificationService();

  public verifyToken = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { token } = req.body;

    try {
      const result = await this.tokenVerificationService.verifyToken(token);
      return res.json(result);
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}

export default TokenVerificationController;
