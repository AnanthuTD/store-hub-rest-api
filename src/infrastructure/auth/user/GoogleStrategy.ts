import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import UserRepository from '../../repositories/UserRepository';
import { IUser } from '../../../domain/entities/User';
import env from '../../env/env';

const userRepository = new UserRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/user/auth/google/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: unknown, user?: IUser | false) => void
    ) => {
      if (!profile.emails) return done('Profile not found');
      try {
        let user = await userRepository.getUserByEmail(profile.emails[0].value);
        if (!user) {
          const newUser: IUser = {
            email: profile.emails?.[0].value || '',
            profile: {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              avatar: profile.photos?.[0].value,
            },
            password: '',
          };
          user = await userRepository.create(newUser);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
