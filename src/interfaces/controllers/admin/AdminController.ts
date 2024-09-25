// src/presentation/controllers/AdminController.ts
import { Request, Response } from 'express';
import { container } from '../../../config/inversify.config';
import { ISignInAdminUseCase } from '../../../application/usecases/SignInAdminUseCase';
import { TYPES } from '../../../config/types';
import env from '../../../infrastructure/env/env';

export const signInAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const signInUseCase = container.get<ISignInAdminUseCase>(
      TYPES.ISignInAdminUseCase
    );
    const response = await signInUseCase.execute(email, password);

    res.cookie('authToken', response.token, {
      httpOnly: false,
      secure: env.isProduction,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
