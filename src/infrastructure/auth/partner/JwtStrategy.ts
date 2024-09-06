import passport from 'passport';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import env from '../../env/env';
import { DeliveryPartnerRepository } from '../../repositories/DeliveryPartnerRepository';

const partnerRepository = new DeliveryPartnerRepository();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
} satisfies StrategyOptionsWithoutRequest;

passport.use(
  'partner-jwt',
  new JwtStrategy(opts, async (jwt_payload, done) => {
    console.log(jwt_payload);
    try {
      const user = await partnerRepository.getById(jwt_payload.id);
      console.log(user);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);
