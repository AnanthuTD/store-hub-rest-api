export default interface IEmailService {
  sendVerificationEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}
