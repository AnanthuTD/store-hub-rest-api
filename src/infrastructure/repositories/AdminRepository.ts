// src/infrastructure/repositories/AdminRepository.ts
import { injectable } from 'inversify';
import { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import Admin from '../database/models/AdminModel';
import { IAdmin } from '../../domain/entities/IAdmin';

@injectable()
export class AdminRepository implements IAdminRepository {
  async findByEmail(email: string) {
    return Admin.findOne({ email }).exec();
  }

  async create(user: IAdmin): Promise<IAdmin> {
    const newUser = new Admin(user);
    return newUser.save();
  }
}
