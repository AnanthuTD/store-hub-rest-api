export interface ISignInAdminUseCase {
  execute(email: string, password: string): Promise<string>; // Returns a token or session ID
}
