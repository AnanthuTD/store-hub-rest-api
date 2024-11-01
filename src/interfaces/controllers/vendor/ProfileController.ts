import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { toShopOwnerSignInResponseDTO } from '../../../application/dto/shopOwnerResponse.dto';
import ShopOwner from '../../../infrastructure/database/models/ShopOwnerModel';

export function getProfile(req: Request, res: Response) {
  const response = toShopOwnerSignInResponseDTO(req.user);
  res.json(response);
}

// Update Avatar Controller
export const updateAvatar = async (req, res) => {
  const avatar = req.file.location;
  const vendorId = req.user._id;

  try {
    const vendor = await ShopOwner.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    vendor.profile.avatar = avatar;
    await vendor.save();
    return res.status(200).json({
      message: 'Avatar updated successfully',
      avatar: vendor.profile.avatar,
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return res.status(500).json({ message: 'Error updating avatar', error });
  }
};

// Update Password Controller
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const vendorId = req.user._id;

  try {
    const vendor = await ShopOwner.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    if (vendor.authMethods && vendor.authMethods?.[0].passwordHash) {
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(
        currentPassword,
        vendor.authMethods[0].passwordHash
      );
      if (!isMatch)
        return res
          .status(400)
          .json({ message: 'Current password is incorrect' });
    } else {
      vendor.authMethods = [
        {
          passwordHash: '',
          provider: 'credential',
        },
      ];
    }

    // Update to new password
    const salt = await bcrypt.genSalt(10);
    vendor.authMethods[0].passwordHash = await bcrypt.hash(newPassword, salt);
    await vendor.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating vendor password: ', error);
    return res.status(500).json({ message: 'Error updating password', error });
  }
};
