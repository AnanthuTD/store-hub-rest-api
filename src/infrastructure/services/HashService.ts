// src/infrastructure/services/HashService.ts
import { injectable } from 'inversify';
import * as bcrypt from 'bcryptjs';
import { IHashService } from '../../domain/services/IHashService';

@injectable()
export class HashService implements IHashService {
  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
