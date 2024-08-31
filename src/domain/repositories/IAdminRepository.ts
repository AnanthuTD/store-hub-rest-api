// src/domain/repositories/IAdminRepository.ts

import { IAdmin } from '../entities/IAdmin';

export interface IAdminRepository {
  findByEmail(email: string): Promise<IAdmin | null>;
}
