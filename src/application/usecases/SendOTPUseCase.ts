import { inject, injectable } from 'inversify';
import { TYPES } from '../../config/types';
import IOTPService from '../../domain/services/IOTPService';
import { getCountryCodes } from './CountryCodeService';
import logger from '../../infrastructure/utils/logger';
import { InvalidCountryCodeError } from '../../errors';

interface SendOTPProps {
  mobileNumber: string;
  countryCode: string;
}

@injectable()
class SendOTPUseCase {
  constructor(@inject(TYPES.OTPService) private otpService: IOTPService) {}

  async execute({ mobileNumber, countryCode }: SendOTPProps): Promise<string> {
    try {
      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      if (!validCountryCodes.includes(countryCode)) {
        logger.warn(`Invalid country code: ${countryCode}`);
        throw new InvalidCountryCodeError();
      }

      const status = await this.otpService.sendOTP(mobileNumber);
      logger.info(`OTP sent to ${mobileNumber} with status ${status}`);
      return status;
    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw error;
    }
  }
}

export default SendOTPUseCase;
