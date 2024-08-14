import { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck';
import { OTPService } from '../../application/usecases/OTPService';

export class OTPVerifierService {
  private otpService: OTPService;

  constructor() {
    this.otpService = new OTPService();
  }

  async verifyOTP(
    countryCode: string,
    mobileNumber: string,
    otp: string
  ): Promise<VerificationCheckInstance> {
    const phoneNumber = `${countryCode}${mobileNumber}`;
    return this.otpService.verifyOTP(phoneNumber, otp);
  }
}
