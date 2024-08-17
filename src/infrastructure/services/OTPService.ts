import { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck';
import { sendOTP, verifyOTP } from '../../config/twilio.config';
import IOTPService from '../../domain/services/IOTPService';
import { injectable } from 'inversify';

@injectable()
export class OTPService implements IOTPService {
  async sendOTP(phoneNumber: string) {
    const verification = await sendOTP(phoneNumber);
    return verification.status;
  }

  async verifyOTP(
    phoneNumber: string,
    code: string
  ): Promise<VerificationCheckInstance> {
    const verificationCheck = await verifyOTP(phoneNumber, code);
    if (verificationCheck.status !== 'approved') {
      throw new Error('Invalid OTP');
    }
    return verificationCheck;
  }
}
