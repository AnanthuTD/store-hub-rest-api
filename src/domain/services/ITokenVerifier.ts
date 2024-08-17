export interface ITokenVerifier {
  verifyToken(
    token: string
  ): Promise<{ valid: boolean; email?: string; message: string }>;
}
