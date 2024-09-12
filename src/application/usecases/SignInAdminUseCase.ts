import { AdminSignInResponseDTO } from '../dto/adminSignInResponse.dto';

export interface ISignInAdminUseCase {
  execute(
    email: string,
    password: string
  ): Promise<{ token: string; admin: AdminSignInResponseDTO }>; // Returns a token or session ID
}
