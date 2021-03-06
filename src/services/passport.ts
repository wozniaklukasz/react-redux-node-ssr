import passport from "passport";
import GoogleStrategy from "passport-google-oauth20/lib/strategy";
import FacebookStrategy from "passport-facebook/lib/strategy";
import TwitterStrategy from "passport-twitter/lib/strategy";
import pool from '../database/db';
import AuthProviderEnum from '../constants/AuthProviderEnum';
import UserRoleEnum from '../constants/UserRoleEnum';

const doStrategy = (strategyType: AuthProviderEnum, accessToken, refreshToken, profile, done) => {
  pool.query('SELECT * FROM users WHERE auth_provider = $1 AND auth_id = $2', [strategyType, profile.id])
    .then((existingUser) => {
      if (existingUser && existingUser.rows[0]) {
        done(null, existingUser.rows[0]);
      } else {
        pool.query('INSERT INTO users (auth_id, auth_provider, name, user_role) VALUES ($1, $2, $3, $4) RETURNING *', [profile.id, strategyType, profile.displayName, UserRoleEnum.ADMIN])
          .then((newUser) => {
            if (newUser && newUser.rows[0]) done(null, newUser.rows[0])
          })
          .catch((e) => console.error(e));
      }
    })
    .catch((e) => console.error(e));
};

passport.serializeUser((user: any, done) => {
  if (user.id)
    done(null, user.id);
  else
    done(null, false);
});

passport.deserializeUser((userId, done) => {
  pool.query('SELECT * FROM users WHERE id = $1', [userId])
    .then((users) => {
      done(null, users.rows[0]);
    })
    .catch((e) => console.error(e));
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      doStrategy(AuthProviderEnum.GOOGLE, accessToken, refreshToken, profile, done);
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      doStrategy(AuthProviderEnum.FACEBOOK, accessToken, refreshToken, profile, done);
    }
  )
);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "/auth/twitter/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      doStrategy(AuthProviderEnum.TWITTER, accessToken, refreshToken, profile, done);
    }
  )
);
