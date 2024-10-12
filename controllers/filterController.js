const jwt = require('jsonwebtoken')
const db = require('../db/db')
const { findUserIdByEmail } = require('../db/helpers/functions')

class filterController {
    static filterMatches = async (req, res) => {
        const token = req.header('Authorization')?.replace('Bearer ', '')
        const { email } = jwt.decode(token)
        const { ageGap, location, fameRate } = req.query
        // il faut filterer les matches existant deja
        let query = `WITH user_location AS (
                    SELECT
                        split_part(location, ',', 1)::float AS user_latitude,
                        split_part(location, ',', 2)::float AS user_longitude
                    FROM users
                    WHERE email = $1
                ),
                mutual_interests AS (
                    SELECT ui1.interest_id
                    FROM user_interests ui1
                    JOIN users u1 ON u1.id = ui1.user_id
                    WHERE u1.email = $1
                )
                SELECT DISTINCT ON (u.id)
                    u.id AS user_id,
                    u.username AS username,
                    u.birthday AS birthday,
                    u.location AS location,
                    i.gender_id AS interested_in,
                    u.gender_id AS gender,
                    ROUND(
                        CAST(
                            6371 * acos(
                                cos(radians(user_location.user_latitude)) * cos(radians(split_part(u.location, ',', 1)::float))
                                * cos(radians(split_part(u.location, ',', 2)::float) - radians(user_location.user_longitude))
                                + sin(radians(user_location.user_latitude)) * sin(radians(split_part(u.location, ',', 1)::float))
                            ) AS numeric
                        ), 
                        2
                    ) AS distance
                FROM users u
                LEFT JOIN interested_in_gender i ON i.user_id = u.id
                JOIN user_location ON true
                JOIN user_interests ui2 ON ui2.user_id = u.id
                JOIN mutual_interests mi ON mi.interest_id = ui2.interest_id
                WHERE u.email != $1
                AND u.setup_finished = true
                    AND u.gender_id IN (
                        SELECT i2.gender_id
                        FROM interested_in_gender i2
                        JOIN users u2 ON u2.id = i2.user_id
                        WHERE u2.email = $1
                    )
                    AND i.gender_id IN (
                        SELECT gender_id
                        FROM users u2
                        WHERE email = $1
                    )
                `
        const params = [email]
        let paramIndex = 2

        if (location) {
            query += `
            AND ROUND(
                CAST(
                    6371 * acos(
                        cos(radians(user_location.user_latitude)) * cos(radians(split_part(u.location, ',', 1)::float))
                        * cos(radians(split_part(u.location, ',', 2)::float) - radians(user_location.user_longitude))
                        + sin(radians(user_location.user_latitude)) * sin(radians(split_part(u.location, ',', 1)::float))
                    ) AS numeric
                ), 
                2
            ) <= $${paramIndex}
        `
            params.push(location)
            paramIndex++
        }

        if (fameRate) {
            query += ` AND u.famerate >= $${paramIndex}`
            params.push(Number(fameRate))
            paramIndex++
        }

        if (ageGap) {
            const [minAge, maxAge] = ageGap.split('-').map(Number)
            query += ` AND DATE_PART('year', AGE(u.birthday)) BETWEEN $${paramIndex} AND $${
                paramIndex + 1
            }`
            params.push(minAge, maxAge)
            paramIndex += 2
        }

        // End the query
        query += ` ORDER BY u.id, distance ASC;`

        try {
            const users = await db.query(query, params)
            const results = users.rows
            return res.json({
                message: 'Filtered matches result',
                matches: results,
            })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Server error' })
        }
    }

    static swipeRight = async (req, res) => {
        try {
            const liked_user_id = req.body.id

            const token = req.header('Authorization')?.replace('Bearer ', '')

            const decoded = jwt.decode(token)
            if (!decoded || !decoded.email)
                return res.status(401).json({ message: 'Invalid token' })

            const email = decoded.email
            const id = await findUserIdByEmail(email)
            if (!id)
                return res
                    .status(404)
                    .json({ message: 'Authenticated user not found' })

            // Prevent user from liking themselves
            if (id === liked_user_id) {
                return res
                    .status(400)
                    .json({ message: 'You cannot like your own profile' })
            }

            // Check if the user has already liked the liked_user_id
            const alreadyLikedQuery = `
                SELECT id FROM user_likes WHERE liker_id = $1 AND liked_user_id = $2`
            const alreadyLiked = await db.query(alreadyLikedQuery, [
                id,
                liked_user_id,
            ])

            if (alreadyLiked.rowCount > 0) {
                return res
                    .status(400)
                    .json({ message: 'You have already liked this profile' })
            }

            const potentialMatchQuery = `
                SELECT id FROM user_likes WHERE liker_id = $1 AND liked_user_id = $2`
            const potentialMatch = await db.query(potentialMatchQuery, [
                liked_user_id,
                id,
            ])
            const alreadyMatchedQuery = `
                SELECT id FROM user_matches WHERE user1_id = $1 AND user2_id = $2 OR user1_id = $2 AND user2_id = $1`
            const alreadyMatched = await db.query(alreadyMatchedQuery, [
                liked_user_id,
                id,
            ])

            if (alreadyMatched.rowCount > 0) {
                return res
                    .status(400)
                    .json({ message: 'You have already matched this profile' })
            }

            if (potentialMatch.rowCount > 0) {
                const createMatchQuery = `
                    INSERT INTO user_matches (user1_id, user2_id, matched_at)
                    VALUES ($1, $2, NOW())
                    RETURNING id, user1_id, user2_id, matched_at`
                const newMatch = await db.query(createMatchQuery, [
                    id,
                    liked_user_id,
                ])

                return res.json({
                    message: 'New match created successfully',
                    newMatch: newMatch.rows[0],
                })
            }
            //  else if (potentialMatch.rowCount == 0) {
            //     return res
            //         .status(400)
            //         .json({ message: 'You have already liked this profile' })
            // }

            const createLikeQuery = `
                INSERT INTO user_likes (liker_id, liked_user_id, created_at)
                VALUES ($1, $2, NOW())
                RETURNING id, liker_id, liked_user_id, created_at`
            const newLike = await db.query(createLikeQuery, [id, liked_user_id])

            return res.json({
                message: 'New profile like created successfully',
                likeRecord: newLike.rows[0],
            })
        } catch (error) {
            console.error('Error in swipeRight:', error)
            return res.status(500).json({
                message: 'An error occurred while processing your request',
            })
        }
    }
}

module.exports = filterController
