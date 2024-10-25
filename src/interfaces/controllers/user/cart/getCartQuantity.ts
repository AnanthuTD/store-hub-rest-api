import { Request, Response } from 'express';
import { CartRepository } from '../../../../infrastructure/repositories/CartRepository';
import { getRequestUserId } from '../../../../infrastructure/utils/authUtils';

const cartRepository = new CartRepository();

export default async function getTotalQuantity(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const userId = getRequestUserId(req);

    const totalQuantity = await cartRepository.getTotalQuantity(userId);

    return res.status(200).json({
      success: true,
      totalQuantity,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Error fetching total quantity',
    });
  }
}
