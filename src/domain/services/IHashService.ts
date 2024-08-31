// src/domain/services/IHashService.ts
export interface IHashService {
  compare(plainText: string, hash: string): Promise<boolean>;
}
