import BannerModal, { IBanner } from '../database/models/BannerModal';

class BannerRepository {
  createBanner = async (bannerData: IBanner): Promise<IBanner> => {
    return await BannerModal.create(bannerData);
  };

  deleteBanner = async (id: string): Promise<void> => {
    await BannerModal.findByIdAndDelete(id);
  };

  getAllBanners = async (): Promise<IBanner[]> => {
    return await BannerModal.find().sort({ priority: -1 });
  };

  getBannersByDate = async (
    startDate: string,
    endDate: string
  ): Promise<IBanner[]> => {
    return await BannerModal.find({
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
    });
  };
}

export default BannerRepository;
