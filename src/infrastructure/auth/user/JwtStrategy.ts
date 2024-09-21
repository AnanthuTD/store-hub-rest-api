import passport from 'passport';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import UserRepository from '../../repositories/UserRepository';
import env from '../../env/env';

const userRepository = new UserRepository();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET,
} satisfies StrategyOptionsWithoutRequest;

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await userRepository.getUserById(jwt_payload.id);
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
