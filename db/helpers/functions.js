const select = require("../../repositories/selectRepo");

async function findUserIdByEmail(email) {
	const { id } = await select("users", ["id"], [["email", email]]);
	return id;
}

async function findGenderIdByName(name) {
	const { id } = await select("gender", ["id"], [["name", name]]);
	return id;
}

async function findInterestIdByName(name) {
	const { id } = await select("interests", ["id"], [["name", name]]);
	return id;
}

async function findRelationIdByName(name) {
	const { id } = await select("relationship_type", ["id"], [["name", name]]);
	return id;
}

module.exports = {
	findUserIdByEmail,
	findGenderIdByName,
	findInterestIdByName,
	findRelationIdByName
};
