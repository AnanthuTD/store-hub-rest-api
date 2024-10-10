import express from 'express';
import { CouponController } from '../../controllers/couponController';
const couponRouter = express.Router();

const couponController = new CouponController();

couponRouter.get('/', couponController.getAllCoupons);
couponRouter.post('/', couponController.addCoupon);
couponRouter.put('/:code', couponController.updateCoupon);
couponRouter.post('/calculate-discount', couponController.calculateDiscount);

export default couponRouter;
