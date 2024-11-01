import passport from 'passport';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import env from '../../env/env';
import { VendorOwnerRepository } from '../../repositories/VendorRepository';

const vendorRepository = new VendorOwnerRepository();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
} satisfies StrategyOptionsWithoutRequest;

passport.use(
  'shop-owner-jwt',
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await vendorRepository.findById(jwt_payload.id);
      if (user) {
        return done(null, user);
      } else {
        return done('No user found', false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);
