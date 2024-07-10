require("dotenv").config();
const db = require("../db/db");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const passport = require("passport");

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3005/auth/google/callback",
			passReqToCallback: true,
		},
		async function (request, accessToken, refreshToken, profile, done) {
			try {
				const result = await db.query(
					"SELECT * FROM user_account ORDER BY id ASC",
			);
				res.send(result.rows);
			} catch (err) {
				console.error(err);
				res.status(500).send("Error");
			}
			return done(null, profile);
			// });
		},
	),
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});
