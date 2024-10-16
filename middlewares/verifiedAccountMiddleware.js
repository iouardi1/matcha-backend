const { Profile } = require("../models/profileModel");
const verifyAccount = async (req, res, next) => {
	const profile = await Profile.profileData(req.email);
	if (!profile) {
		return res
				.status(200)
				.json({ shouldRedirect: true, redirectTo: "/auth/login" });
	}
	if (req.email && (req.path !== "/setup") ) {
		if (!profile?.setup_finished) {
			return res
				.status(200)
				.json({ shouldRedirect: true, redirectTo: "/setup" });
		}
	} else if (req.path === "/setup") {
		if (profile?.setup_finished) {
			return res
				.status(200)
				.json({ shouldRedirect: true, redirectTo: "/accueil" });
		}
	}
	next();
};
module.exports = verifyAccount;
 