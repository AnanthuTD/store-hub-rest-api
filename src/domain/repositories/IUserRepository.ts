import { IUser } from '../entities/User';

export interface IUserRepository {
  create(user: IUser): Promise<IUser>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserById(id: string): Promise<IUser | null>;
  getUserByMobile(mobile: string): Promise<IUser | null>;
}
