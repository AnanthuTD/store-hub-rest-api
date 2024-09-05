import { inject, injectable } from 'inversify';
import { TYPES } from '../../config/types';
import { getCountryCodes } from './CountryCodeService';
import IOTPService from '../../domain/services/IOTPService';
import { VerificationCheckInstance } from 'twilio/lib/rest/verify/v2/service/verificationCheck';
import logger from '../../infrastructure/utils/logger';
import { InvalidCountryCodeError } from '../../errors';

interface VerifyOTPProps {
  mobileNumber: string;
  code: string;
  countryCode: string;
}

@injectable()
class VerifyOTPUseCase {
  constructor(@inject(TYPES.OTPService) private otpService: IOTPService) {}

  async execute({
    mobileNumber,
    code,
    countryCode,
  }: VerifyOTPProps): Promise<VerificationCheckInstance> {
    try {
      // Fetch valid country codes and check if the provided country code is valid
      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      if (!validCountryCodes.includes(countryCode)) {
        logger.warn(`Invalid country code: ${countryCode}`);
        throw new InvalidCountryCodeError();
      }

      // Verify OTP
      const verification = await this.otpService.verifyOTP(
        countryCode + mobileNumber,
        code
      );

      // Log the verification status
      logger.info(
        `OTP verification status for ${mobileNumber}: ${verification.status}`
      );

      return verification;
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }
}

export default VerifyOTPUseCase;
