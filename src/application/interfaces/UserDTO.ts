import { IUser } from '../../domain/entities/User';

export interface UserDTO {
  id: string;
  profile: IUser['profile'];
}
