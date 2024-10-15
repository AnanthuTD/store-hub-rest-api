import { User } from '../../../infrastructure/database/models/UserSchema';
import { Request, Response } from 'express';

class AdminUserController {
  // Fetch all users, excluding passwords, sorted by creation date
  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await User.find({}, { password: 0 }).sort({
        createdAt: -1,
      });
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching users',
      });
    }
  };
}

export default new AdminUserController();
