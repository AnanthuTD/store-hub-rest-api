import { Request, Response } from 'express';
import { getCountryCodes } from '../../application/usecases/CountryCodeService';
import MobileNumberRegisterUser from '../../application/usecases/RegisterUserWithMobile';

export class OTPRegisterController {
  private mobileNumberRegisterUser: MobileNumberRegisterUser;

  constructor(mobileNumberRegisterUser: MobileNumberRegisterUser) {
    this.mobileNumberRegisterUser = mobileNumberRegisterUser;
  }

  async register(req: Request, res: Response) {
    try {
      const { countryCode, mobileNumber, firstName, lastName, password, otp } =
        req.body;
      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      if (!validCountryCodes.includes(countryCode)) {
        return res.status(400).json({ error: 'Invalid country code.' });
      }

      try {
        await this.mobileNumberRegisterUser.execute({
          mobileNumber: countryCode + mobileNumber,
          firstName,
          lastName,
          password,
          otp,
        });
        return res.sendStatus(201);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
