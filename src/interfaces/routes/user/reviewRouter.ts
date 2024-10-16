import { Router } from 'express';
import ReviewModel from '../../../infrastructure/database/models/ReviewSchema';
import { StoreProductRepository } from '../../../infrastructure/repositories/storeProductRepository';

const reviewRouter = Router();

// create a review
reviewRouter.post('/', async (req, res) => {
  const { productId, rating, message } = req.body;
  const userId = req.user._id;

  try {
    const newReview = await ReviewModel.findOneAndUpdate(
      { productId, userId },
      { productId, userId, rating, message },
      { upsert: true, new: true }
    );

    new StoreProductRepository().updateRating(productId, rating);

    res.status(201).json(newReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating review' });
  }
});

// get reviews for a specific product
reviewRouter.get('/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const reviews = await ReviewModel.find({ productId })
      .populate('userId', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

reviewRouter.get('/:productId/user-review', async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  try {
    const review = await ReviewModel.findOne({ productId, userId }).sort({
      createdAt: -1,
    });
    // .populate('userId', 'profile.firstName profile.lastName')
    res.status(200).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

export default reviewRouter;
