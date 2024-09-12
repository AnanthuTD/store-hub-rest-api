import { IUser } from '../../domain/entities/User';

export interface UserResponseDTO {
  id: string;
  profile: IUser['profile'];
}
