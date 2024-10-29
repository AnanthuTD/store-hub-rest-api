import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { IUser } from '../../../domain/entities/User';
import env from '../../env/env';
import { VendorOwnerRepository } from '../../repositories/VendorRepository';
import { IShopOwner } from '../../../domain/entities/IShopOwner';

const vendor = new VendorOwnerRepository();

passport.use(
  'shop-owner-google',
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/vendor/auth/google/callback',
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: unknown, user?: IUser | false) => void
    ) => {
      if (!profile.emails) return done('Profile not found');
      try {
        let user = await vendor.getByEmail(profile.emails[0].value);
        if (!user) {
          const newUser: IShopOwner = {
            email: profile.emails?.[0].value || '',
            profile: {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              address: {
                city: '',
                country: '',
                postalCode: '',
                state: '',
                street: '',
              },
              avatar: profile.photos?.[0].value || '',
            },
          };
          user = await vendor.create(newUser);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
