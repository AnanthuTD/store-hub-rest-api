// src/presentation/controllers/AdminController.ts
import { Request, Response } from 'express';
import { container } from '../../../../config/inversify.config';
import { TYPES } from '../../../../config/types';
import { SignInShopOwnerUseCase } from '../../../../application/usecases/ShopOwnerSignInUseCase';
import { setAuthTokenInCookies } from '../../../../infrastructure/auth/setAuthTokenInCookies';

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

    setAuthTokenInCookies(response.token, res);

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
