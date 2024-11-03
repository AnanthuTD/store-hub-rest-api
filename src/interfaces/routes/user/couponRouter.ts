import express from 'express';
import { CouponController } from '../../controllers/couponController';

const couponRouter = express.Router();
const couponController = new CouponController();

couponRouter.get('/', couponController.getAvailableCoupons);
couponRouter.get('/all', couponController.getAllCoupons);

export default couponRouter;
