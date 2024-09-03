import { Request, Response } from 'express';
import { DeliveryPartnerRepository } from '../../../infrastructure/repositories/DeliveryPartnerRepository';
import { container } from '../../../config/inversify.config';
import VerifyOTPUseCase from '../../../application/usecases/VerifyOTPUseCase';
import { TYPES } from '../../../config/types';

class VerifyOTPController {
  private partnerRepo = new DeliveryPartnerRepository();
  private verifyOTPService = container.get<VerifyOTPUseCase>(
    TYPES.VerifyOTPUseCase
  );

  handle = async (req: Request, res: Response) => {
    try {
      const {
        countryCode,
        phone,
        otp,
      }: { countryCode: string; phone: string; otp: string } = req.body;

      console.log(countryCode, phone, otp);

      try {
        await this.verifyOTPService.execute({
          countryCode,
          mobileNumber: phone,
          code: otp,
        });
      } catch {
        return res.status(400).json({ error: 'Invalid or expired OTP.' });
      }

      const fullMobileNumber = `${countryCode}${phone}`;
      let partner = await this.partnerRepo.getUserByMobile(fullMobileNumber);

      if (!partner) {
        // Partner not found, create a new one
        partner = await this.partnerRepo.save({
          phone: fullMobileNumber,
        });

        // Generate token with partner ID
        // const token = TokenService.generateToken(partner._id!);

        // Set token in an HTTP-only cookie
        // res.cookie('authToken', token, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === 'production',
        //   maxAge: 24 * 60 * 60 * 1000, // 1 day
        //   sameSite: 'strict',
        // });

        return res.json({
          message: 'Account created and login successful',
          user: { id: partner._id! },
        });
      }

      if (!partner.isVerified) {
        // Partner found but no profile, generate token with partner ID
        // const token = TokenService.generateToken(partner._id!);

        // Set token in an HTTP-only cookie
        /* res.cookie('', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 1 day
          sameSite: 'strict',
        }); */

        return res.json({
          message: 'Login successful, please complete your profile',
          user: { id: partner._id! },
        });
      }

      // Profile exists, just send a message
      return res.json({
        message: 'User already exists with a profile.',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export default new VerifyOTPController();
