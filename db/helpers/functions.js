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
async function calculateAge(birthday) {
	const birthDate = new Date(birthday);
	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
	  age--;
	}
	return age;
  };


module.exports = {
	findUserIdByEmail,
	findGenderIdByName,
	findInterestIdByName,
	calculateAge,
};
