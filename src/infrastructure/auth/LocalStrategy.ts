import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/UserRepository';
import { IUser } from '../../domain/entities/User';

const userRepository = new UserRepository();

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: IUser, done) => {
  done(null, user.id as unknown);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userRepository.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
