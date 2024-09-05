import { Request, Response } from 'express';
import { container } from '../../config/inversify.config';
import { TYPES } from '../../config/types';
import RegisterUserWithMobile from '../../application/usecases/RegisterUserWithMobile';
import { getCountryCodes } from '../../application/usecases/CountryCodeService';

export class RegisterUserMobileController {
  private registerUserWithMobileUseCase: RegisterUserWithMobile;

  constructor() {
    this.registerUserWithMobileUseCase = container.get<RegisterUserWithMobile>(
      TYPES.RegisterUserWithMobile
    );
  }

  public async handle(
    req: Request,
    res: Response,
    role: 'user' | 'deliveryPartner'
  ): Promise<Response> {
    try {
      const { countryCode, mobileNumber, firstName, lastName, password, otp } =
        req.body;

      // Fetch valid country codes and check if the provided country code is valid
      const validCountryCodes = (await getCountryCodes()).map(
        ({ code }) => code
      );

      if (!validCountryCodes.includes(countryCode)) {
        return res.status(400).json({ error: 'Invalid country code.' });
      }

      try {
        // Execute the use case to register the user
        await this.registerUserWithMobileUseCase.execute({
          mobileNumber: `${countryCode}${mobileNumber}`,
          firstName,
          lastName,
          password,
          otp,
          role,
        });

        return res.sendStatus(201);
      } catch (error) {
        // Handle errors from the use case
        return res.status(400).json({ error: (error as Error).message });
      }
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: (error as Error).message });
    }
  }
}

export default RegisterUserMobileController;
