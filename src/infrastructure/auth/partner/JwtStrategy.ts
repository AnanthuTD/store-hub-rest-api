import passport from 'passport';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import env from '../../env/env';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET_DELIVERY_PARTNER,
} satisfies StrategyOptionsWithoutRequest;

passport.use(
  'partner-jwt',
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = {
        _id: jwt_payload.id,
      };
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
