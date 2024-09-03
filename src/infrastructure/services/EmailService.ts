import nodemailer from 'nodemailer';
import env from '../env/env';
import { injectable } from 'inversify';
import IEmailService from '../../domain/services/IEmailService';
import { MailOptions } from 'nodemailer/lib/sendmail-transport';

@injectable()
class EmailService implements IEmailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  async sendVerificationEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const mailOptions: MailOptions = {
      to,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export default EmailService;
