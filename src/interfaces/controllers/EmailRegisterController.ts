import { Request, Response } from 'express';
import { registerSchema } from '../../validators/authValidators';
import TokenVerificationService from '../../infrastructure/services/TokenVerificationService';
import { ZodError } from 'zod';
import RegisterUser from '../../application/usecases/RegisterUserWithEmail';

class RegisterController {
  private registerUser: RegisterUser;
  private tokenVerificationService: TokenVerificationService;

  constructor(
    registerUser: RegisterUser,
    tokenVerificationService: TokenVerificationService
  ) {
    this.registerUser = registerUser;
    this.tokenVerificationService = tokenVerificationService;
  }

  async handle(req: Request, res: Response): Promise<void> {
    const { firstName, lastName, password, token } = req.body;

    try {
      const { valid, message, email } =
        await this.tokenVerificationService.verifyToken(token);

      if (!valid) {
        res.status(401).json({ message, valid });
        return;
      }

      try {
        registerSchema.parse({ email, password, firstName, lastName });
      } catch (error) {
        if (error instanceof ZodError) {
          res
            .status(400)
            .json({ errors: error.errors.map((error) => error.message) });
          return;
        }
        throw error;
      }

      const user = await this.registerUser.execute(email, password);
      res.status(201).json({ user });
      return;
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
  }
}

export default RegisterController;
