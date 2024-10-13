import crypto from 'node:crypto';

export function generateOTP() {
  const otp = crypto.randomInt(100000, 999999);
  return otp;
}
