import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import UserRepository from '../repositories/UserRepository';
import { IUser } from '../../domain/entities/User';
import env from '../env/env';

const userRepository = new UserRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/google/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: unknown, user?: IUser | false) => void
    ) => {
      try {
        let user = await userRepository.getUserByGoogleId(profile.id);
        if (!user) {
          const newUser: IUser = {
            email: profile.emails?.[0].value || '',
            googleId: profile.id,
            displayName: profile.displayName || '',
            password: '',
          };
          user = await userRepository.createUser(newUser);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
