import { Request, Response } from 'express';
import { CartRepository } from '../../../../infrastructure/repositories/CartRepository';

const cartRepository = new CartRepository();

export default async function getTotalQuantity(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const userId = req.user._id;

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
