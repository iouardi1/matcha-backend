const jwt = require("jsonwebtoken");
const { Profile } = require("../models/profileModel");

class ProfileController {
	static async getProfileDetails(req, res) {
		console.log('here');
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
		return res.status(200).json({ shouldRedirect: true, redirectTo: "/accueil"});
	}

	static async getProfileInfos(req, res) {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
		const profile = await Profile.profileDataCustumized(email);
		return res.status(200).json({ data: profile });
	}

	static async getListOfMatches(req, res) {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
		const matches = await Profile.getListOfMatches(email);
		return res.status(200).json({ data: matches });
	}
}

module.exports = ProfileController;
