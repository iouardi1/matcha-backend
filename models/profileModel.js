const db = require("../db/db");

const Profile = {
	
  profileData: async (email) => {
		const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);
		return rows[0];
	},

};

module.exports = { Profile };
