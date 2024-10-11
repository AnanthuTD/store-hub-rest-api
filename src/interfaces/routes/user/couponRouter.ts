import express from 'express';
import { CouponController } from '../../controllers/couponController';

const couponRouter = express.Router();
const couponController = new CouponController();

couponRouter.get('/', couponController.getAvailableCoupons);

export default couponRouter;
