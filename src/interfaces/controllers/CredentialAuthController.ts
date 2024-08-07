import { Request, Response } from 'express';
import { TokenService } from '../../infrastructure/services/TokenService';
import logger from '../../infrastructure/utils/logger';

class CredentialAuthController {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.body;
      const token = TokenService.generateToken(id);
      res.json({ token });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error generating token:', error.message);
      } else {
        logger.error('Error generating token:', 'Unknown error');
      }

      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new CredentialAuthController();
