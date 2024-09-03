import { UserRole } from '../../domain/entities/roles';

export enum EmailProcess {
  SIGNUP_VERIFICATION = 'signup_verification',
  PASSWORD_RESET = 'password_reset',
  OTHER = 'other',
}

interface EmailTemplateProps {
  name: string;
  verificationLink?: string;
  resetLink?: string;
  role: UserRole;
}

// HTML version of the signup verification template
function getSignupVerificationTemplate({
  name,
  verificationLink,
  role,
}: EmailTemplateProps): string {
  return `
    <html>
      <body>
        <p>Dear <strong>${role} ${name}</strong>,</p>

        <p>Welcome to our platform! Please verify your email address by clicking the link below:</p>

        <p><a href="${verificationLink}" style="color: blue;">Verify Email</a></p>

        <p>If you did not sign up for this account, please ignore this email.</p>

        <p>Best regards,<br/>Your Company Team</p>
      </body>
    </html>
  `;
}

// HTML version of the password reset template
function getPasswordResetTemplate({
  name,
  resetLink,
  role,
}: EmailTemplateProps): string {
  return `
    <html>
      <body>
        <p>Dear <strong>${role} ${name}</strong>,</p>

        <p>We received a request to reset your password. Please reset your password by clicking the link below:</p>

        <p><a href="${resetLink}" style="color: blue;">Reset Password</a></p>

        <p>If you did not request a password reset, please ignore this email.</p>

        <p>Best regards,<br/>Your Company Team</p>
      </body>
    </html>
  `;
}

// HTML version of the other process template
function getOtherProcessTemplate({ name, role }: EmailTemplateProps): string {
  return `
    <html>
      <body>
        <p>Dear <strong>${role} ${name}</strong>,</p>

        <p>This is a notification related to your account.</p>

        <p>Please contact support if you have any questions.</p>

        <p>Best regards,<br/>Your Company Team</p>
      </body>
    </html>
  `;
}

export default function generateEmailTemplate({
  process,
  props,
}: {
  process: EmailProcess;
  props: EmailTemplateProps;
}): string {
  switch (process) {
    case EmailProcess.SIGNUP_VERIFICATION:
      return getSignupVerificationTemplate(props);
    case EmailProcess.PASSWORD_RESET:
      return getPasswordResetTemplate(props);
    case EmailProcess.OTHER:
    default:
      return getOtherProcessTemplate(props);
  }
}
