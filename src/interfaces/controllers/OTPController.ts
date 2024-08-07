import { Request, Response } from 'express';
import { OTPService } from '../../application/usecases/OTPService';

class OTPController {
  private otpService: OTPService;

  constructor(otpService: OTPService) {
    this.otpService = otpService;
  }

  async sendOTP(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;
      const status = await this.otpService.sendOTP(phoneNumber);
      res.json({ status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { phoneNumber, code } = req.body;
      const verification = await this.otpService.verifyOTP(phoneNumber, code);
      res.json({ verification });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default OTPController;
