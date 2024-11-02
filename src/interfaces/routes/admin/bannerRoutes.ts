import express from 'express';
import BannerController from '../../controllers/BannerController';
import { upload } from '../../middleware/multerS3Config';

const adminBannerRouter = express.Router();

const bannerController = new BannerController();

adminBannerRouter.post(
  '/',
  upload.single('image'),
  bannerController.createBanner
);
adminBannerRouter.delete('/:id', bannerController.deleteBanner);
adminBannerRouter.get('/', bannerController.getAllBanners);
adminBannerRouter.get('/by-date', bannerController.getBannersByDate);

export default adminBannerRouter;
