import { Twilio } from 'twilio';
import env from '../infrastructure/env/env';

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const serviceSid = env.TWILIO_SERVICE_SID;

const twilioClient = new Twilio(accountSid, authToken);

export const sendOTP = (phoneNumber: string) => {
  return twilioClient.verify.v2.services(serviceSid).verifications.create({
    to: phoneNumber,
    channel: 'sms',
  });
};

export const verifyOTP = (phoneNumber: string, code: string) => {
  return twilioClient.verify.v2.services(serviceSid).verificationChecks.create({
    to: `+91${phoneNumber}`,
    code,
  });
};
