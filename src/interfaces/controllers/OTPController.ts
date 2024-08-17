import { Request, Response } from 'express';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';
import SendOTPUseCase from '../../application/usecases/SendOTPUseCase';
import VerifyOTPUseCase from '../../application/usecases/VerifyOTPUseCase';

class OTPController {
  private sendOTPUseCase = container.get<SendOTPUseCase>(TYPES.SendOTPUseCase);
  private verifyOTPUseCase = container.get<VerifyOTPUseCase>(
    TYPES.VerifyOTPUseCase
  );

  async sendOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { countryCode, mobileNumber } = req.body;

      const status = await this.sendOTPUseCase.execute({
        mobileNumber,
        countryCode,
      });
      return res.json({ status });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<Response> {
    try {
      const { countryCode, mobileNumber, otp } = req.body;

      const verification = await this.verifyOTPUseCase.execute({
        mobileNumber,
        countryCode,
        code: otp,
      });
      return res.json({ verification });
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default OTPController;
