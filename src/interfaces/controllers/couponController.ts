import { Request, Response } from 'express';
import { couponRepository } from '../../infrastructure/repositories/couponRepository';
import logger from '../../infrastructure/utils/logger';
import { discountUseCase } from '../../application/usecases/discountUsecase';
import { getRequestUserId } from '../../infrastructure/utils/authUtils';

export class CouponController {
  couponRepository = couponRepository;

  addCoupon = async (req: Request, res: Response) => {
    try {
      const couponData = req.body;

      await this.couponRepository.addCoupon(couponData);
    } catch (err) {
      if (err.code === 11000) {
        res.status(400).json({ message: 'Coupon code already exists' });
      } else {
        res.status(500).json({ message: 'Error adding coupon' });
      }

      logger.error(err);
    }
  };

  getAllCoupons = async (req: Request, res: Response) => {
    try {
      const coupons = await this.couponRepository.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      logger.error('Error fetching coupons:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  updateCoupon = async (req: Request, res: Response) => {
    const { code } = req.params;
    const { discountType, discountValue, minOrderValue, expirationDate } =
      req.body;
    const updatedCouponData = {
      discountType,
      discountValue,
      minOrderValue,
      expirationDate,
    };

    try {
      await this.couponRepository.updateCoupon(code, updatedCouponData);
      res.json({ message: 'Coupon updated successfully' });
    } catch (error) {
      logger.error('Error updating coupon:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  getAvailableCoupons = async (req: Request, res: Response) => {
    const { totalAmount } = req.query;
    const userId = getRequestUserId(req);

    if (!totalAmount || isNaN(totalAmount)) {
      return res.status(400).json({ message: 'Total amount is required' });
    }

    try {
      const coupons = await this.couponRepository.getAvailableCoupons(
        userId,
        Number(totalAmount)
      );
      res.json({ message: 'Coupons fetched successfully', coupons });
    } catch (error) {
      logger.error('Error fetching available coupons:', error);
      res.status(500).json({ message: 'Internal Server Error', coupons: [] });
    }
  };

  calculateDiscount = async (req: Request, res: Response) => {
    const { code, totalAmount } = req.body;
    const userId = getRequestUserId(req);

    try {
      const { discount, finalAmount } = await discountUseCase.calculate(
        userId,
        code,
        totalAmount
      );

      res.json({
        success: true,
        discount,
        finalAmount,
        message: `Coupon applied successfully. You saved ₹${discount}!`,
      });

      res.json({ success: true, discount });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
