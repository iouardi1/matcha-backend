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
            `SELECT id, firstname, lastname, email, famerate, aboutme, username, auth_provider, birthday, setup_finished FROM users u WHERE email = $1`,
            [email]
        )
        return rows[0]
    },

    profileDetails: async (email, senderEmail) => {
        const { rows } = await db.query(
            ` WITH user_location AS (
                    SELECT
                        split_part(location, ',', 1)::float AS user_latitude,
                        split_part(location, ',', 2)::float AS user_longitude
                    FROM users
                    WHERE email = $2
                )
                SELECT 
                    u.id,
                    u.firstname,
                    u.lastname,
                    u.email,
                    u.famerate,
                    u.aboutme,
                    u.username,
                    u.auth_provider,
                    u.birthday,
                    u.setup_finished,
                    u.status,
                    U.last_seen,
                    g.name AS gender,
                    ARRAY_AGG(DISTINCT up.photo_url) AS photos,
                    ARRAY_AGG(DISTINCT i.name) AS interests,
                    EXTRACT(YEAR FROM AGE(u.birthday)) AS age,
                    rt.name AS relation_type,
                    ROUND(
                        CAST(
                            6371 * acos(
                                cos(radians(user_location.user_latitude)) * cos(radians(split_part(u.location, ',', 1)::float))
                                * cos(radians(split_part(u.location, ',', 2)::float) - radians(user_location.user_longitude))
                                + sin(radians(user_location.user_latitude)) * sin(radians(split_part(u.location, ',', 1)::float))
                            ) AS numeric
                        )
                    ) AS distance
                FROM 
                    users u
                JOIN 
                    gender g ON u.gender_id = g.id
                JOIN 
                    user_location ON true
                LEFT JOIN 
                    user_photo up ON u.id = up.user_id
                LEFT JOIN 
                    user_interests ui ON u.id = ui.user_id
                LEFT JOIN 
                    interests i ON ui.interest_id = i.id
                LEFT JOIN 
                    interested_in_relation ir ON u.id = ir.user_id
                LEFT JOIN 
                    relationship_type rt ON ir.relationship_type_id = rt.id
                WHERE 
                    u.email = $1
                GROUP BY 
                    u.id, g.name, user_location.user_latitude, user_location.user_longitude, rt.name;`,
            [email, senderEmail]
        )
        return rows[0]
    },

    profileDataCustumized: async (email) => {
        const { rows } = await db.query(
            `SELECT 
			u.id AS id,
			u.username AS username,
			up.photo_url AS profile_picture,
            COUNT(ul.liked_user_id) AS number_of_likes
			FROM users u
			LEFT JOIN user_photo up ON up.user_id = u.id AND up.active = true
            LEFT JOIN user_likes ul ON ul.liked_user_id = u.id
			WHERE email = $1
            GROUP BY u.id, u.username, up.photo_url;
        `,
            [email]
        )
        return rows[0]
    },

    getListOfMatches: async (email) => {
        const { rows } = await db.query(
            `SELECT
                u.id AS id,
                u.username AS username,
            u.email AS email,
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

    getListOfNotifs: async (email) => {
        const { rows } = await db.query(
            `
            SELECT
                n.type AS type,
                n.createdat AS date,
                n.senderid AS senderid,
                sender_user.username AS sender,
                up.photo_url AS profile_picture
            FROM users u 
            JOIN notification n ON n.receiverid = u.id
            JOIN user_photo up ON up.user_id = n.senderid
            JOIN users sender_user ON sender_user.id = n.senderid
            WHERE u.email = $1;
            `,
            [email]
        )
        return rows
    },

    createNotif: async (data, email) => {
        const senderId = await findUserIdByEmail(email)
        let receiverId
        if (data.user) receiverId = await findUserIdByEmail(data.user)
        else if (data.id) receiverId = data.id

        const type = data.notifType

        const { rows } = await db.query(
            `
                INSERT INTO Notification (senderId, receiverId,type) values ($1, $2, $3)
            `,
            [senderId, receiverId, type]
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
                ['aboutme', 'birthday', 'gender_id'],
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
