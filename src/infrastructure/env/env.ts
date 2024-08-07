import { cleanEnv, str, port, url } from 'envalid';

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
});

export default env;
