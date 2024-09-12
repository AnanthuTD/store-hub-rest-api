import { Request, Response } from 'express';
import { getCountryCodes } from '../../application/usecases/CountryCodeService';
import TokenService from '../../infrastructure/services/TokenService';
import env from '../../infrastructure/env/env';
import { UserResponseDTO } from '../../application/dto/userResponse.dto';
import logger from '../../infrastructure/utils/logger';
import UserRepository from '../../infrastructure/repositories/UserRepository';
import VerifyOTPUseCase from '../../application/usecases/VerifyOTPUseCase';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';

class SigninMobileController {
  private userRepo = new UserRepository();
  private verifyOTPService = container.get<VerifyOTPUseCase>(
    TYPES.VerifyOTPUseCase
  );

  async handle(req: Request, res: Response) {
    try {
      const {
        countryCode,
        mobileNumber,
        otp,
      }: { countryCode: string; mobileNumber: string; otp: string } = req.body;

      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      if (!validCountryCodes.includes(countryCode)) {
        res.status(400).json({ error: 'Invalid country code.' });
        return;
      }

      try {
        await this.verifyOTPService.execute({
          countryCode,
          mobileNumber,
          code: otp,
        });
      } catch {
        res.status(400).json({ error: 'Invalid or expired OTP.' });
        return;
      }

      const user = await this.userRepo.getUserByMobile(
        `${countryCode}${mobileNumber}`
      );

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const newUser: UserResponseDTO = { id: user.id!, profile: user.profile };

      // Generate a token
      const token = TokenService.generateToken(user.id!);

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

export default SigninMobileController;
