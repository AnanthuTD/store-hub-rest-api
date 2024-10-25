import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import UserRepository from '../../repositories/UserRepository';
import z from 'zod';
import { UserResponseDTO } from '../../../application/dto/userResponse.dto';
import logger from '../../utils/logger';

const userRepository = new UserRepository();

passport.use(
  new LocalStrategy(
    {
      usernameField: 'emailOrMobile',
      session: false,
    },
    async (emailOrMobile, password, done) => {
      try {
        const user = await getUserByEmailOrMobile(emailOrMobile, password);

        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }

        return done(null, user);
      } catch (err) {
        logger.error('Error in LocalStrategy:', err);
        return done(err);
      }
    }
  )
);

const emailOrMobileSchema = z.union([
  z.string().email({ message: 'Invalid email format' }),
  z.string().regex(/^\d{10}$/, {
    message: 'Invalid mobile number format. It should be 10 digits.',
  }),
]);

async function getUserByEmailOrMobile(
  emailOrMobile: string,
  password: string
): Promise<UserResponseDTO | null> {
  const validation = emailOrMobileSchema.safeParse(emailOrMobile);

  if (!validation.success) {
    logger.error(
      'Invalid email or mobile number format:',
      validation.error.errors
    );
    return null;
  }

  const isEmail = z.string().email().safeParse(emailOrMobile).success;
  const user = isEmail
    ? await userRepository.getUserByEmail(emailOrMobile)
    : await userRepository.getUserByMobile('+91' + emailOrMobile);

  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return null;
  }

  return { id: user.id, profile: user.profile } as UserResponseDTO;
}
