import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { userRepository } from "../repositories/user.repository";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("passport");

passport.use(
  new GoogleStrategy(
    {
      clientID: env.google.clientId,
      clientSecret: env.google.clientSecret,
      callbackURL: env.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value ?? "";
        const name = profile.displayName ?? "";
        const avatar = profile.photos?.[0]?.value ?? "";

        const user = await userRepository.upsertFromGoogle({ googleId, email, name, avatar });
        log.info({ userId: user.id, email }, "Google OAuth success");
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

passport.serializeUser((user: unknown, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
