export default interface IEmailService {
  sendVerificationEmail({
    to,
    verificationLink,
  }: {
    to: string;
    verificationLink: string;
  }): Promise<void>;
}
