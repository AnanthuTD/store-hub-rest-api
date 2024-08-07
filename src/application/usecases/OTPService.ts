import { sendOTP, verifyOTP } from '../../config/twilio.config';

export class OTPService {
  async sendOTP(phoneNumber: string) {
    const verification = await sendOTP(phoneNumber);
    return verification.status;
  }

  async verifyOTP(phoneNumber: string, code: string) {
    const verificationCheck = await verifyOTP(phoneNumber, code);
    if (verificationCheck.status !== 'approved') {
      throw new Error('Invalid OTP');
    }
    return verificationCheck;
  }
}
