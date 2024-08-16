import { Request, Response } from 'express';
import { getCountryCodes } from '../../application/usecases/CountryCodeService';
import { IUserRepository } from '../../application/interfaces/IUserRepository';
import { OTPService } from '../../application/usecases/OTPService';
import { UserDTO } from '../../application/interfaces/UserDTO';
import TokenService from '../../infrastructure/services/TokenService';
import env from '../../infrastructure/env/env';
import logger from '../../infrastructure/utils/Logger';

class OTPLoginController {
  private otpService: OTPService;
  private userRepo: IUserRepository;

  constructor(otpService: OTPService, userRepo: IUserRepository) {
    this.otpService = otpService;
    this.userRepo = userRepo;
  }

  async loginWithOTP(req: Request, res: Response) {
    try {
      const { countryCode, mobileNumber, otp } = req.body;

      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      if (!validCountryCodes.includes(countryCode)) {
        res.status(400).json({ error: 'Invalid country code.' });
        return;
      }

      const isOTPValid = await this.otpService.verifyOTP(
        countryCode + mobileNumber,
        otp
      );

      console.log(isOTPValid);

      if (!isOTPValid || !isOTPValid.valid) {
        res.status(400).json({ error: 'Invalid or expired OTP.' });
        return;
      }

      const user = await this.userRepo.getUserByMobile(
        `${countryCode}${mobileNumber}`
      );

      console.log(user);

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const newUser: UserDTO = { id: user.id, profile: user.profile };

      // Generate a token
      const token = TokenService.generateToken(user.id);

      // Set token in an HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: env.isProduction,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'strict',
      });

      res.json({ message: 'Login successful', user: newUser });
      return;
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ error: 'Invalid OTP' });
    }
  }
}

export default OTPLoginController;
