import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../../infrastructure/database/models/UserSchema';

// Update Avatar Controller
export const updateAvatar = async (req: Request, res: Response) => {
  const avatar = req?.file?.location;
  const userId = req.user._id;

  if (!avatar) {
    return res.status(400).json({ message: 'No avatar provided' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Vendor not found' });

    user.profile.avatar = avatar;
    await user.save();
    return res.status(200).json({
      message: 'Avatar updated successfully',
      avatar: user?.profile?.avatar,
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return res.status(500).json({ message: 'Error updating avatar', error });
  }
};

// Update Password Controller
export const updatePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Vendor not found' });

    if (user.password) {
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: 'Current password is incorrect' });
    } else {
      user.password = '';
    }

    // Update to new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating vendor password: ', error);
    return res.status(500).json({ message: 'Error updating password', error });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const {
    email,
    profile: { firstName, lastName },
  } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Vendor not found' });

    user.email = email || user.email;
    user.profile.firstName = firstName || user.firstName;
    user.profile.lastName = lastName || user.lastName;

    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating vendor password: ', error);
    return res.status(500).json({ message: 'Error updating password', error });
  }
};
