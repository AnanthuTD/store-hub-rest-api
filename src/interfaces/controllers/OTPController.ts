import { Request, Response } from 'express';
import { OTPService } from '../../application/usecases/OTPService';
import { getCountryCodes } from '../../application/usecases/CountryCodeService';

class OTPController {
  private otpService: OTPService;

  constructor(otpService: OTPService) {
    this.otpService = otpService;
  }

  async sendOTP(req: Request, res: Response) {
    try {
      const { countryCode, mobileNumber } = req.body;

      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      // Check if the provided country code is valid
      if (!validCountryCodes.includes(countryCode)) {
        return res.status(400).json({ error: 'Invalid country code.' });
      }

      const phoneNumber = `${countryCode}${mobileNumber}`;

      const status = await this.otpService.sendOTP(phoneNumber);
      res.json({ status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { countryCode, mobileNumber, code } = req.body;
      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      // Check if the provided country code is valid
      if (!validCountryCodes.includes(countryCode)) {
        return res.status(400).json({ error: 'Invalid country code.' });
      }

      const phoneNumber = `${countryCode}${mobileNumber}`;

      const verification = await this.otpService.verifyOTP(phoneNumber, code);
      res.json({ verification });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default OTPController;
