import { injectable } from 'inversify';
import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../database/models/User';

@injectable()
class UserRepository implements IUserRepository {
  async createUser(user: IUser): Promise<IUser> {
    const newUser = new User(user);
    return newUser.save();
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async getUserByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  }

  async getUserById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async getUserByMobile(mobileNumber: string): Promise<IUser | null> {
    return User.findOne({ mobileNumber });
  }
}

export default UserRepository;
