import { Request, Response } from 'express';
import { DeliveryPartnerRepository } from '../../../../infrastructure/repositories/DeliveryPartnerRepository';
import { container } from '../../../../config/inversify.config';
import VerifyOTPUseCase from '../../../../application/usecases/VerifyOTPUseCase';
import { TYPES } from '../../../../config/types';
import { IDeliveryPartner } from '../../../../domain/entities/DeliveryPartner';
import TokenService from '../../../../infrastructure/services/TokenService';
import env from '../../../../infrastructure/env/env';

class VerifyOTPController {
  private partnerRepo = new DeliveryPartnerRepository();
  private verifyOTPService = container.get<VerifyOTPUseCase>(
    TYPES.VerifyOTPUseCase
  );

  // Function to extract and validate input parameters
  private extractInput(req: Request) {
    const {
      countryCode,
      phone,
      otp,
    }: { countryCode: string; phone: string; otp: string } = req.body;
    console.log(countryCode, phone, otp);
    return { countryCode, phone, otp };
  }

  // Function to handle OTP verification
  private async verifyOTP({
    countryCode,
    phone,
    otp,
  }: {
    countryCode: string;
    phone: string;
    otp: string;
  }) {
    try {
      await this.verifyOTPService.execute({
        countryCode,
        mobileNumber: phone,
        code: otp,
      });
    } catch {
      throw new Error('Invalid or expired OTP.');
    }
  }

  // Function to get or create a delivery partner
  private async getOrCreatePartner(fullMobileNumber: string) {
    let partner = await this.partnerRepo.getUserByMobile(fullMobileNumber);

    if (!partner) {
      partner = await this.partnerRepo.save({ phone: fullMobileNumber });
      return { partner, newUser: true };
    }

    return { partner, newUser: false };
  }

  // Function to build the response based on the partner's status
  private buildResponse(partner: IDeliveryPartner, newUser: boolean) {
    if (newUser) {
      return { message: 'Account created and login successful', partner };
    }

    if (!partner.isVerified) {
      const documentStatus = {};

      if (partner.documents) {
        Object.keys(partner.documents).forEach((key) => {
          documentStatus[key] = partner.documents[key].status;
        });
      }

      const notYetSubmitted = Object.values(documentStatus).every(
        (value) => value === 'pending'
      );

      if (notYetSubmitted) {
        return { partner };
      }

      return {
        documentStatus,
        message: partner.message,
      };
    }

    return { message: 'User already exists with a profile.', partner };
  }

  // Main handler function
  handle = async (req: Request, res: Response) => {
    try {
      const { countryCode, phone, otp } = this.extractInput(req);

      // Verify OTP
      try {
        await this.verifyOTP({ countryCode, phone, otp });
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }

      // Get or create partner
      const fullMobileNumber = `${countryCode}${phone}`;
      const { partner, newUser } =
        await this.getOrCreatePartner(fullMobileNumber);

      const token = TokenService.generateToken(
        partner._id!,
        env.JWT_SECRET_DELIVERY_PARTNER,
        {
          _id: partner._id,
          firstName: partner.firstName,
          lastName: partner.lastName,
          avatar: partner.avatar,
          email: partner.email,
          phone: partner.phone,
        }
      );

      res.cookie('authToken', token, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      });

      // Build and send response
      const response = this.buildResponse(partner, newUser);
      return res.json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export default new VerifyOTPController();
