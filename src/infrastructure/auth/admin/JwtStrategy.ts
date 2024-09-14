import passport from 'passport';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import env from '../../env/env';
import { AdminRepository } from '../../repositories/AdminRepository';

const adminRepository = new AdminRepository();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
} satisfies StrategyOptionsWithoutRequest;

passport.use(
  'admin-jwt',
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const admin = await adminRepository.getById(jwt_payload.id);
      if (admin) {
        return done(null, admin);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);
