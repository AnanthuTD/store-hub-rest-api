import express from 'express';
import BannerController from '../../controllers/BannerController';

const userBannerRouter = express.Router();

const bannerController = new BannerController();

userBannerRouter.get('/', bannerController.getUnExpiredBanners);

export default userBannerRouter;
