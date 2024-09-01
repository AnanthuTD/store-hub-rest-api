// src/presentation/controllers/AdminController.ts
import { Request, Response } from 'express';
import { container } from '../../../config/inversify.config';
import { TYPES } from '../../../config/types';
import env from '../../../infrastructure/env/env';
import { SignInShopOwnerUseCase } from '../../../application/usecases/ShopOwnerSignInUseCase';

export const CredentialSignInShopOwner = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;

  try {
    const signInUseCase = container.get<SignInShopOwnerUseCase>(
      TYPES.ISignInShopOwnerUseCase
    );
    const response = await signInUseCase.execute(email, password);

    res.cookie('authToken', response.token, {
      httpOnly: true,
      secure: env.isProduction,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
