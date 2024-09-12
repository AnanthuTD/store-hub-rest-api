import { Request, Response } from 'express';
import { toShopOwnerSignInResponseDTO } from '../../../application/dto/shopOwnerResponse.dto';

export function getProfile(req: Request, res: Response) {
  const response = toShopOwnerSignInResponseDTO(req.user);
  res.json(response);
}
