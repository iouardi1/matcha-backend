const jwt = require("jsonwebtoken");
const db = require("../db/db");
const { Profile } = require("../models/profileModel");

class ProfileController {
	static async getProfileDetails(req, res) {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
		const profile = await Profile.profileData(email);
		return res.status(200).json({ data: profile });
	}
}

module.exports = ProfileController;
