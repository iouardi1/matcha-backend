const jwt = require("jsonwebtoken");
const { Profile } = require("../models/profileModel");

class ProfileController {
	static async getProfileDetails(req, res) {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
		const profile = await Profile.profileData(email);
		return res.status(200).json({ data: profile });
	}

	static async getSetupProfile(req, res) {
		const { username } = await Profile.profileData(req.email);
		return res.status(200).json({ username: username });
	}

	static async setupProfile(req, res) {
		const data = req.body;
		await Profile.profileSetup(data, req.email);
		return res.status(200);
	}

	static async getProfileInfos(req, res) {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
		console.log(email);
		const profile = await Profile.profileDataCustumized(email);
		return res.status(200).json({ data: profile });
	}
}

module.exports = ProfileController;
