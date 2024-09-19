const { default: axios } = require("axios");
const db = require("../db/db");
const select = require("../repositories/selectRepo");

const User = {
	create: async ({ firstname, lastname, username, email, password }) => {
		const { rows } = await db.query(
			"INSERT INTO users (firstname, lastname, username, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *",
			[firstname, lastname, username, email, password],
		);
		return rows[0];
	},

	findByEmail: async (email) => {
		const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);
		return rows[0];
	},

	updatePassword:  async (userId, newPassword) => {
		const query = 'UPDATE users SET password = $1 WHERE id = $2';
		const values = [newPassword, userId];
		await db.query(query, values);
	},

	createGoogleAccount: async (
		{ given_name, family_name, email, provider, id}
	) => {
		const { rows } = await db.query(
			"select * from users where provider_id=$1",
			[id],
		);
		if (!rows.length) {
			const googleUser = await db.query(
				"INSERT INTO users (firstname, lastname, email, auth_provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
				[given_name, family_name, email, provider, id],
			);
		}
	}, 

	findAllUsers: async () => {
		const { rows } = await select("users", ["*"], []);
		// return rows[0];
	},

	// getAccessTokenByUserId: async (provider_id) => {
	// 	const { rows } = await db.query( 
	// 		"SELECT access_token FROM users WHERE provider_id = $1",
	// 		[provider_id],
	// 	);
	// 	return rows[0];
	// },
};

module.exports = { User };
