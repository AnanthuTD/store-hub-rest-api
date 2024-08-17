import { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck';

export default interface IOTPService {
  sendOTP(phone: string): Promise<string>;
  verifyOTP(phone: string, otp: string): Promise<VerificationCheckInstance>;
}
