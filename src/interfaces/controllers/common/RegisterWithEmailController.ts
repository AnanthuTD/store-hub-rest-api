import { Request, Response } from 'express';
import { registerSchema } from '../../../validators/authValidators';
import { ZodError } from 'zod';
import RegisterUserUseCase from '../../../application/usecases/RegisterUserWithEmail';
import { container } from '../../../config/inversify.config';
import { TYPES } from '../../../config/types';

class RegisterWithEmailController {
  private registerUserUseCase = container.get<RegisterUserUseCase>(
    TYPES.RegisterUserUseCase
  );

  handle = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, password, token } = req.body;

    try {
      // Validate input using Zod
      try {
        registerSchema.parse({ password, firstName, lastName });
      } catch (error) {
        if (error instanceof ZodError) {
          res
            .status(400)
            .json({ errors: error.errors.map((error) => error.message) });
          return;
        }
        throw error;
      }

      // Execute the use case
      const user = await this.registerUserUseCase.execute({
        password,
        firstName,
        lastName,
        token,
      });

      // Respond with the newly created user
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof Error && error.message) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
      console.error('Error during registration:', error);
    }
  };
}

export default RegisterWithEmailController;
