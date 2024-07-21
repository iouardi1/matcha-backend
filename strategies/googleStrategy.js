require("dotenv").config();
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");
const {User} = require("../models/userModel");
require("dotenv").config();
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL:  process.env.BACKEND_LOCAL_DEV + "/api/auth/google/callback",
			passReqToCallback: true,
		},
		async function (request, accessToken, refreshToken, profile, done) {
			return done(null, profile);
		},
	),
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});
