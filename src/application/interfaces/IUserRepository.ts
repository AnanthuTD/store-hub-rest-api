import { IUser } from '../../domain/entities/User';

export interface IUserRepository {
  getUserByGoogleId(googleId: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  createUser(user: IUser): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getUserByMobile(mobile: string): Promise<IUser | null>;
}
