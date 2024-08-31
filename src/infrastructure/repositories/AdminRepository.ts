// src/infrastructure/repositories/AdminRepository.ts
import { injectable } from 'inversify';
import { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import Admin from '../database/models/AdminModel';

@injectable()
export class AdminRepository implements IAdminRepository {
  async findByEmail(email: string) {
    return Admin.findOne({ email }).exec();
  }
}
