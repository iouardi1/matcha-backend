const select = require('../../repositories/selectRepo')
const db = require('../db')

async function findUserIdByEmail(email) {
    const { id } = await select('users', ['id'], [['email', email]])
    return id
}

async function findEmailByUserId(id) {
    const { email } = await select('users', ['email'], [['id', id]])
    return email
}

async function findUsernameIdByEmail(email) {
    const { username } = await select('users', ['username'], [['email', email]])
    return username
}

async function findGenderIdByName(name) {
    const { id } = await select('gender', ['id'], [['name', name]])
    return id
}

async function findInterestIdByName(name) {
    const { id } = await select('interests', ['id'], [['name', name]])
    return id
}
async function calculateAge(birthday) {
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--
    }
    return age
}

async function findRelationIdByName(name) {
    const { id } = await select('relationship_type', ['id'], [['name', name]])
    return id
}

async function getNotifSenderData(email) {
    const { rows } = await db.query(
        `
			SELECT
					u.username AS sender,
					up.photo_url AS profile_picture
			FROM users u 
			JOIN user_photo up ON up.user_id = u.id
			WHERE u.email = $1;
			`,
        [email]
    )
    return rows
}

module.exports = {
    findUserIdByEmail,
    findGenderIdByName,
    findInterestIdByName,
    calculateAge,
    findRelationIdByName,
    findUsernameIdByEmail,
    getNotifSenderData,
    findEmailByUserId,
}
