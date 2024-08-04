import { cleanEnv, str, num } from 'envalid'


const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
  PORT: num()
})

export default env