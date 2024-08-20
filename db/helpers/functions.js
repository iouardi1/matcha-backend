const select = require("../../repositories/selectRepo");

async function findUserIdByEmail(email) {
	const {id} = await select("users", ["id"], [["email", email]]);
	return id
}

module.exports = { findUserIdByEmail };
