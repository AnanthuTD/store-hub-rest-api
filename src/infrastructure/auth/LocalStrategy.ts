import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/UserRepository';
import { IUser } from '../../domain/entities/User';
import z from 'zod';
import logger from '../utils/Logger';

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

interface UserDTO {
  id: string;
  profile: IUser['profile'];
}

const emailOrMobileSchema = z.union([
  z.string().email({ message: 'Invalid email format' }),
  z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, { message: 'Invalid mobile number format' }),
]);

async function getUserByEmailOrMobile(
  emailOrMobile: string,
  password: string
): Promise<UserDTO | null> {
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
    : await userRepository.getUserByMobile(emailOrMobile);

  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return null;
  }

  return { id: user.id, profile: user.profile } as UserDTO;
}
