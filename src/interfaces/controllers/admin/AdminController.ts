// src/presentation/controllers/AdminController.ts
import { Request, Response } from 'express';
import { container } from '../../../config/inversify.config';
import { ISignInAdminUseCase } from '../../../application/usecases/SignInAdminUseCase';
import { TYPES } from '../../../config/types';

export const signInAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const signInUseCase = container.get<ISignInAdminUseCase>(
      TYPES.ISignInAdminUseCase
    );
    const token = await signInUseCase.execute(email, password);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
