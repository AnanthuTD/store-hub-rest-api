import { Request, Response } from 'express';
import TokenVerificationService from '../../infrastructure/services/TokenVerificationService';

class TokenVerificationController {
  private tokenVerificationService: TokenVerificationService;

  constructor(tokenVerificationService: TokenVerificationService) {
    this.tokenVerificationService = tokenVerificationService;
  }

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
