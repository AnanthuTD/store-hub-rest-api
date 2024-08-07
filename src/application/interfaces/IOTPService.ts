export interface IOTPService {
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
  sendOtp(phoneNumber: string): Promise<void>;
}
