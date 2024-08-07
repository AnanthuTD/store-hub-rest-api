import { Request, Response } from 'express';
import { registerSchema } from '../../validators/authValidators';
import { IRegisterUser } from '../../application/interfaces/IRegisterUser';

class RegisterController {
  private registerUser: IRegisterUser;

  constructor(registerUser: IRegisterUser) {
    this.registerUser = registerUser;
  }

  async handle(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      registerSchema.parse({ email, password });
      const user = await this.registerUser.execute(email, password);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.errors });
    }
  }
}

export default RegisterController;
