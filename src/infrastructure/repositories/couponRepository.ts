import { ObjectId } from 'mongoose';
import Coupon, { ICoupon } from '../database/models/CouponSchema';

class CouponRepository {
  async addCoupon(coupon: ICoupon) {
    return (await Coupon.create(coupon)).save();
  }

  async findCouponByCode(code: string) {
    return await Coupon.findOne({ code });
  }

  async getAllCoupons() {
    return await Coupon.find().exec();
  }

  async getAvailableCoupons(
    userId: ObjectId,
    totalAmount: number
  ): Promise<ICoupon[]> {
    try {
      const currentDate = new Date();
      const coupons = await Coupon.find({
        expirationDate: { $gte: currentDate },
        minOrderValue: { $lte: totalAmount },
        usedBy: {
          $elemMatch: {
            userId: userId,
            usedCount: { $lt: '$perUserLimit' },
          },
        },
      }).exec();

      return coupons;
    } catch (error) {
      console.error('Error retrieving valid coupons:', error);
      return [];
    }
  }

  async validateCouponForUser(
    code: string,
    userId: ObjectId,
    totalAmount: number
  ): Promise<ICoupon> {
    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    if (coupon.expirationDate < new Date()) {
      throw new Error('Coupon has expired');
    }

    const userUsage = coupon.usedBy.find(
      (usage) => usage.userId.toString() === userId.toString()
    );
    if (userUsage && userUsage.usedCount >= coupon.perUserLimit) {
      throw new Error('You have reached your usage limit for this coupon.');
    }

    if (totalAmount < coupon.minOrderValue) {
      throw new Error(`Order value must be at least ₹${coupon.minOrderValue}.`);
    }

    return coupon;
  }

  async incrementCouponUsage(userId: ObjectId, couponCode: string) {
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    const userUsage = coupon.usedBy.find(
      (usage) => usage.userId.toString() === userId.toString()
    );

    if (userUsage) {
      userUsage.usedCount += 1;
    } else {
      coupon.usedBy.push({ userId, usedCount: 1 });
    }

    await coupon.save();
  }

  async createCoupon(couponData: any) {
    const coupon = new Coupon(couponData);
    return await coupon.save();
  }

  async deleteCouponByCode(code: string) {
    return await Coupon.deleteOne({ code });
  }

  async updateCoupon(code: string, updateData: any) {
    return await Coupon.findOneAndUpdate({ code }, updateData, { new: true });
  }
}

export const couponRepository = new CouponRepository();
