import { Request, Response } from 'express';
import { IUser } from '../../domain/entities/User';

class ProfileController {
  async handle(req: Request, res: Response) {
    const user = req.user as IUser;
    res.json({ id: user.id, profile: user?.profile });
  }
}

export default ProfileController;
