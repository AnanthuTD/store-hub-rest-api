import { Request, Response } from 'express';
import BannerRepository from '../../infrastructure/repositories/BannerRepository';

class BannerController {
  private bannerRepository = new BannerRepository();

  createBanner = async (req: Request, res: Response): Promise<void> => {
    try {
      const bannerImageUrl = req?.file?.location;

      if (!bannerImageUrl) {
        res.status(400).json({ message: 'Image not found' });
        return;
      }

      const banner = await this.bannerRepository.createBanner({
        ...req.body,
        imageUrl: bannerImageUrl,
      });
      res.status(201).json(banner);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  deleteBanner = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.bannerRepository.deleteBanner(req.params.id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  getAllBanners = async (req: Request, res: Response): Promise<void> => {
    try {
      const banners = await this.bannerRepository.getAllBanners();
      res.status(200).json(banners);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  getBannersByDate = async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };
    try {
      const banners = await this.bannerRepository.getBannersByDate(
        startDate,
        endDate
      );
      res.status(200).json(banners);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  getUnExpiredBanners = async (req: Request, res: Response): Promise<void> => {
    try {
      const banners = await this.bannerRepository.getUnExpiredBanners();
      res.status(200).json(banners);
    } catch {
      res.status(500).json({ message: 'Failed to fetch unexpired banners' });
    }
  };
}

export default BannerController;
