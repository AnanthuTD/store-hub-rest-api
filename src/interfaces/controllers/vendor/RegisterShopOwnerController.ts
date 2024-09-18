import { Request, Response } from 'express';
import { container } from '../../../config/inversify.config';
import { TYPES } from '../../../config/types';
import { UpdateShopOwnerUseCase } from '../../../application/usecases/UpdateShopOwner';
import logger from '../../../infrastructure/utils/logger';

async function updateShopOwner(req: Request, res: Response) {
  const updateShopOwnerUseCase = container.get<UpdateShopOwnerUseCase>(
    TYPES.UpdateShopOwnerUseCase
  );
  try {
    const { _id } = req.user; // Assuming the shop owner ID is passed in the URL
    const updatedData = req.body; // The new shop owner data from the request body

    await updateShopOwnerUseCase.execute(_id, updatedData);

    return res.status(200).json({ message: 'ShopOwner updated successfully' });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message || 'Failed to update ShopOwner',
    });
    logger.error('error', error);
  }
}

export default updateShopOwner;
