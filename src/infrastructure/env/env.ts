import { cleanEnv, str, port, url, email } from 'envalid';

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production', 'staging'],
  }),
  PORT: port(),
  MONGO_URI: url(),
  JWT_SECRET: str(),
  JWT_EXPIRATION_TIME: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  TWILIO_ACCOUNT_SID: str(),
  TWILIO_AUTH_TOKEN: str(),
  TWILIO_SERVICE_SID: str(),
  FRONTEND_BASE_URL: url(),
  FRONTEND_VERIFICATION_ROUTE: str(),
  EMAIL_VERIFICATION_TOKEN_EXPIRATION_TIME: str(),
  EMAIL_USER: email(),
  EMAIL_PASS: str(),
  FRONTEND_USER_HOME: str(),
  AWS_ACCESS_KEY_ID: str(),
  AWS_SECRET_ACCESS_KEY: str(),
  AWS_REGION: str(),
  S3_BUCKET_NAME: str(),
  RAZORPAY_SECRET: str(),
  RAZORPAY_KEY_ID: str(),
  REDIS_URL: str(),
  JWT_SECRET_DELIVERY_PARTNER: str(),
  GOOGLE_MAPS_API_KEY: str(),
  GOOGLE_APPLICATION_CREDENTIALS: str(),
  RAZORPAY_WEBHOOK_SECRET: str(),
});

export default env;
