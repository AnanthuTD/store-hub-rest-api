import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../../application/interfaces/IUserRepository';
import { User } from '../database/models/User';

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
}

export default UserRepository;
