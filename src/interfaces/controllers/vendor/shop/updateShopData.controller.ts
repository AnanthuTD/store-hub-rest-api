import { Request, Response } from 'express';
import Shop from '../../../../infrastructure/database/models/ShopSchema';
import { z } from 'zod';

// Define Zod schema for shop update
const shopUpdateSchema = z.object({
  name: z.string().optional(),
  location: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  categories: z.string().optional(),
  address: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
      state: z.string().optional(),
      street: z.string().optional(),
    })
    .optional(),
  description: z.string().optional(),
  contactInfo: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      website: z.string().url().optional(),
    })
    .optional(),
  operatingHours: z
    .object({
      monday: z.string().optional(),
      tuesday: z.string().optional(),
      wednesday: z.string().optional(),
      thursday: z.string().optional(),
      friday: z.string().optional(),
      saturday: z.string().optional(),
      sunday: z.string().optional(),
    })
    .optional(),
  images: z.array(z.string()).optional(),
});

export default async function updateShopData(req: Request, res: Response) {
  const shopId = req.params.shopId;
  const updatedData = req.body;

  // Validate the data using Zod
  const validation = shopUpdateSchema.safeParse(updatedData);

  // If validation fails, return error response
  if (!validation.success) {
    return res.status(400).json({
      message: 'Invalid data provided',
      errors: validation.error.format(),
    });
  }

  const filteredData = validation.data;

  try {
    const updatedShop = await Shop.findByIdAndUpdate(shopId, filteredData, {
      new: true,
      runValidators: true,
    });

    if (!updatedShop) {
      return res
        .status(400)
        .json({ message: 'Shop not found! Please try registering' });
    }

    res.status(200).json(updatedShop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update shop data' });
  }
}
