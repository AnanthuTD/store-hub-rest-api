import { Request, Response } from 'express';
import { IUser } from '../../domain/entities/User';

class ProfileController {
  async handle(req: Request, res: Response) {
    const user = req.user as IUser;
    res.json(user);
  }
}

export default new ProfileController();
