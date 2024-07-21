const express = require("express");
const passport = require("passport");
const router = express.Router();
const AuthController = require("../controllers/authController");
require("dotenv").config();

// Register route
router.post("/register", AuthController.registerUser);

// Login route
router.post("/login", AuthController.loginUser);

router.get(
	"/google",
	passport.authenticate("google", { scope: ["email", "profile"] }),
);

router.get(
	"/google/callback",
	passport.authenticate("google", {
		failureRedirect: process.env.FRONTEND_LOCAL_DEV + "/login",
	}),
	async (req, res) => {
		AuthController.loginGoogleUser(req, res)
	},
);

module.exports = router;