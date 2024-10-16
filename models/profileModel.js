const db = require('../db/db')
const {
    findUserIdByEmail,
    findGenderIdByName,
    findInterestIdByName,
    findRelationIdByName,
} = require('../db/helpers/functions')
const { insertOne } = require('../repositories/insertRepo')
const { insertMany } = require('../repositories/insertRepo')
const select = require('../repositories/selectRepo')
const update = require('../repositories/updateRepo')

const Profile = {
    profileData: async (email) => {
        const { rows } = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )
        return rows[0]
    },

    profileDataCustumized: async (email) => {
        const { rows } = await db.query(
            `SELECT 
			u.id AS id,
			u.username AS username,
			up.photo_url AS profile_picture
			FROM users u
			LEFT JOIN user_photo up ON up.user_id = u.id AND up.active = true
			WHERE email = $1`,
            [email]
        )
        return rows[0]
    },

    getListOfMatches: async (email) => {
        const { rows } = await db.query(
            `SELECT
                u.id AS id,
                u.username AS username,
                up.photo_url AS profile_picture
            FROM users u
            LEFT JOIN user_photo up ON up.user_id = u.id AND up.active = true
            WHERE u.id IN (
                SELECT
                    CASE 
                        WHEN m.user1_id = me.id THEN m.user2_id
                        WHEN m.user2_id = me.id THEN m.user1_id
                    END
                FROM user_matches m
                JOIN users me ON (me.email = $1)
                WHERE (m.user1_id = me.id OR m.user2_id = me.id)
            )
            AND u.email != $1
            AND u.id NOT IN (
                SELECT blocked_user_id
                FROM user_blocks
                WHERE blocker_id = (SELECT id FROM users WHERE email = $1)
            )
            AND u.id NOT IN (
                SELECT blocker_id
                FROM user_blocks
                WHERE blocked_user_id = (SELECT id FROM users WHERE email = $1)
            );

            `,
            [email]
        )
        return rows
    },

    profileSetup: async (data, email) => {
        const {
            images,
            bio,
            interests,
            gender,
            intrestedIn,
            birthday,
            username,
            relation,
        } = data

        if (
            !images ||
            images.length < 1 ||
            !interests ||
            interests.length < 3 ||
            !gender ||
            gender.trim() === '' ||
            !birthday ||
            birthday.trim() === '' ||
            !username ||
            username.trim() === '' ||
            !relation ||
            relation.trim() === ''
        ) {
            return {
                error: 'Invalid profile data. Please ensure all fields are correctly filled.',
            }
        }

        const id = await findUserIdByEmail(email)
        const gender_id = await findGenderIdByName(gender)
        const intrested_in_gender_id = await findGenderIdByName(intrestedIn)

        const row = await select('users', ['username'], [['id', id]])

        if (row.username === null) {
            await update(
                'users',
                ['username', 'aboutme', 'birthday', 'gender_id'],
                [username, bio, new Date(birthday), gender_id],
                [['id', id]]
            )
        } else {
            await update(
                'users',
                ['aboutme', 'birthday' ,'gender_id'],
                [bio, new Date(birthday), gender_id],
                [['id', id]]
            )
        }

        if (images.length > 1) {
            var imageSet = []
            let isProfileImage
            images.forEach(async (element, index) => {
                if (index === 0) isProfileImage = true
                else isProfileImage = false
                imageSet.push([
                    id,
                    element.path.url,
                    new Date().toISOString(),
                    isProfileImage,
                ])
            })
            await insertMany(
                'user_photo',
                ['user_id', 'photo_url', 'upload_date', 'active'],
                imageSet
            )
        } else {
            await insertOne(
                'user_photo',
                ['user_id', 'photo_url', 'upload_date', 'active'],
                [id, images[0].path.url, new Date().toISOString(), true]
            )
        }

        await insertOne(
            'interested_in_gender',
            ['user_id', 'gender_id'],
            [id, intrested_in_gender_id]
        )

        var interestSet = []
        interests.forEach(async (element) => {
            let interest_id = await findInterestIdByName(element)
            interestSet.push([id, interest_id])
        })

        let relationId = await findRelationIdByName(relation)

        await insertOne(
            'interested_in_relation',
            ['user_id', 'relationship_type_id'],
            [id, relationId]
        )

        setTimeout(async () => {
            await insertMany(
                'user_interests',
                ['user_id', 'interest_id'],
                interestSet
            )
        }, 1000)
        await update('users', ['setup_finished'], [true], [['id', id]])
        return id
    },

    getSetupData: async (email) => {
        const genders = await db.query('SELECT name FROM gender')
        const interests = await db.query('SELECT name FROM interests')
        const relationships = await db.query(
            'SELECT name FROM relationship_type'
        )
        return {
            genders: genders.rows,
            interests: interests.rows,
            relationships: relationships.rows,
        }
    },
}

module.exports = { Profile }
