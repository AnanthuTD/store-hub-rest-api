import { ObjectId } from 'mongoose';
import { couponRepository } from '../../infrastructure/repositories/couponRepository';

class DiscountUseCase {
  async calculate(userId: ObjectId, code: string, totalAmount: number) {
    if (!userId || !code || !totalAmount) {
      return { discount: 0, finalAmount: totalAmount, minOrderValue: 0 };
    }

    const coupon = await couponRepository.validateCouponForUser(
      code,
      userId,
      totalAmount
    );

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (totalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'FIXED') {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, totalAmount);

    return {
      discount,
      finalAmount: totalAmount - discount,
      minOrderValue: coupon.minOrderValue,
    };
  }

  async apply(userId: ObjectId, code: string, totalAmount: number) {
    const data = await this.calculate(userId, code, totalAmount);
    if (data.discount > 0) {
      await couponRepository.incrementCouponUsage(userId, code);
    }
    return data;
  }
}

export const discountUseCase = new DiscountUseCase();
