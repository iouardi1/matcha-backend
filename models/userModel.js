const { default: axios } = require("axios");
const db = require("../db/db");
const select = require("../repositories/selectRepo");

const User = {
	create: async ({ firstname, lastname, username, email, password, verification_token }) => {
		const { rows } = await db.query(
			"INSERT INTO users (firstname, lastname, username, email, password, verification_token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
			[firstname, lastname, username, email, password, verification_token],
		);
		return rows[0];
	},

	findByEmail: async (email) => {
		const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);
		return rows[0];
	},
	findByVerificationToken: async (verification_token) => {
		const { rows } = await db.query("SELECT * FROM users WHERE verification_token = $1", [
			verification_token,
		]);
		return rows[0];
	},

	updatePassword:  async (userId, newPassword) => {
		const query = 'UPDATE users SET password = $1 WHERE id = $2';
		const values = [newPassword, userId];
		await db.query(query, values);
	},

	updateVerifiedAccount:  async (userId) => {
		const query = `
			UPDATE users 
				SET verified_account = true, verification_token = NULL
			WHERE id = $1
			RETURNING *;`
		const values = [userId];
		const res = await db.query(query, values);
		return res.rows[0]
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
				"INSERT INTO users (firstname, lastname, email, famerate, auth_provider, provider_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
				[given_name, family_name, email, 10, provider, id],
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
