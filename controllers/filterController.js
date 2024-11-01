const jwt = require('jsonwebtoken')
const db = require('../db/db')
const { findUserIdByEmail } = require('../db/helpers/functions')
const { io } = require('../routes/socket.router')

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
                        u.id AS id,
                        u.username AS username,
                        DATE_PART('year', AGE(u.birthday)) AS age,
                        u.location AS location,
                        i.gender_id AS interested_in,
                        u.gender_id AS gender,
                        up.photo_url AS profile_picture,
                        u.famerate AS famerate,
                        u.email AS email,
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
                    JOIN user_photo up on up.user_id = u.id AND active = true
                    LEFT JOIN interested_in_gender i ON i.user_id = u.id
                    JOIN user_location ON true
                    JOIN user_interests ui2 ON ui2.user_id = u.id
                    JOIN mutual_interests mi ON mi.interest_id = ui2.interest_id
                    LEFT JOIN user_likes ul ON ul.liked_user_id = u.id AND ul.liker_id = (SELECT id FROM users WHERE email = $1)
                    LEFT JOIN user_matches um ON (um.user1_id = u.id OR um.user2_id = u.id)
                        AND (um.user1_id = (SELECT id FROM users WHERE email = $1) OR um.user2_id = (SELECT id FROM users WHERE email = $1))
                    LEFT JOIN user_dislikes ud ON ud.disliker_id = (SELECT id FROM users WHERE email = $1) AND ud.disliked_user_id = u.id
                    LEFT JOIN user_blocks ub ON ub.blocker_id = (SELECT id FROM users WHERE email = $1) AND ub.blocked_user_id = u.id
                    LEFT JOIN user_blocks ub2 ON ub2.blocker_id = u.id AND ub2.blocked_user_id = (SELECT id FROM users WHERE email = $1)
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

                    AND ul.liker_id IS NULL
                    AND um.id IS NULL
                    AND ud.disliked_user_id IS NULL
                    AND ub.blocked_user_id IS NULL
                    AND ub2.blocker_id IS NULL
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

            const dislikeCheckQuery = `
                DELETE FROM user_dislikes 
                WHERE disliker_id = $1 AND disliked_user_id = $2 
                RETURNING id`

            const dislikeRemoved = await db.query(dislikeCheckQuery, [id, liked_user_id])


            const createLikeQuery = `
                INSERT INTO user_likes (liker_id, liked_user_id, created_at)
                VALUES ($1, $2, NOW())
                RETURNING id, liker_id, liked_user_id, created_at`
            const newLike = await db.query(createLikeQuery, [id, liked_user_id])
            await filterController.updateFameRate(liked_user_id)

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
                    message: 'New match',
                    // newMatch: newMatch.rows[0],
                })
            }



            return res.json({
                message: 'New profile like created successfully',
                // likeRecord: newLike.rows[0],
            })
        } catch (error) {
            console.error('Error in swipeRight:', error)
            return res.status(500).json({
                message: 'An error occurred while processing your request',
            })
        }
    }

    static swipeLeft = async (req, res) => {
        try {
            const disliked_user_id = req.body.id

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
            if (id === disliked_user_id) {
                return res
                    .status(400)
                    .json({ message: 'You cannot dislike your own profile' })
            }

            // Check if the user has already liked the liked_user_id
            const alreadyDislikedQuery = `
                SELECT id FROM user_dislikes WHERE disliker_id = $1 AND disliked_user_id = $2`
            const alreadyDisliked = await db.query(alreadyDislikedQuery, [
                id,
                disliked_user_id,
            ])

            if (alreadyDisliked.rowCount > 0) {
                return res
                    .status(400)
                    .json({ message: 'You have already disliked this profile' })
            }

            const likeCheckQuery = `
                DELETE FROM user_likes 
                WHERE liker_id = $1 AND liked_user_id = $2 
                RETURNING id`

            const likeRemoved = await db.query(likeCheckQuery, [id, disliked_user_id])

            const createDislikeQuery = `
                INSERT INTO user_dislikes (disliker_id, disliked_user_id, disliked_at)
                VALUES ($1, $2, NOW())
                RETURNING id, disliker_id, disliked_user_id, disliked_at`
            const newDislike = await db.query(createDislikeQuery, [
                id,
                disliked_user_id,
            ])

            return res.json({
                message: 'New profile dislike created successfully',
                // dislikeRecord: newDislike.rows[0],
            })
        } catch (error) {
            console.error('Error in swipeLeft:', error)
            return res.status(500).json({
                message: 'An error occurred while processing your request',
            })
        }
    }
    static blockUser = async (req, res) => {
        try {
            const blocked_user_id = req.body.match_id
                ? req.body.match_id
                : req.body.id

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
            if (id === blocked_user_id) {
                return res
                    .status(400)
                    .json({ message: 'You cannot block your own profile' })
            }

            // Check if the user has already liked the liked_user_id
            const alreadyBlockedQuery = `
                SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_user_id = $2`
            const alreadyBlocked = await db.query(alreadyBlockedQuery, [
                id,
                blocked_user_id,
            ])

            if (alreadyBlocked.rowCount > 0) {
                return res
                    .status(400)
                    .json({ message: 'You have already blocked this profile' })
            }

            const createBlockQuery = `
                INSERT INTO user_blocks (blocker_id, blocked_user_id, blocked_at)
                VALUES ($1, $2, NOW())
                RETURNING id, blocker_id, blocked_user_id, blocked_at`
            const newBlock = await db.query(createBlockQuery, [
                id,
                blocked_user_id,
            ])

            return res.json({
                message: 'New profile blocked successfully',
            })
        } catch (error) {
            console.error('Error in swipeLeft:', error)
            return res.status(500).json({
                message: 'An error occurred while processing your request',
            })
        }
    }

    static updateFameRate = async (user_id) => {
        try {
            const maxLikesQuery = `
                SELECT MAX(likes_count) AS max_likes
                FROM (
                    SELECT COUNT(*) AS likes_count
                    FROM user_likes
                    GROUP BY liked_user_id
                ) AS likes_data;`
            const maxLikesResult = await db.query(maxLikesQuery, [])
            const maxLikes = maxLikesResult.rows[0]?.max_likes || 1  // Default to 1 to prevent division by 0
    
            // Get the maximum conversations with more than 10 messages by any user
            const maxConversationsQuery = `
              SELECT p1.user_id, COUNT(DISTINCT p1.conversation_id) AS conversation_count
                FROM participant p1
                JOIN conversation c ON p1.conversation_id = c.id AND c.fame_rate_updated = true
                JOIN message m ON m.participant_id = p1.id
                JOIN (
                    SELECT p.conversation_id
                    FROM participant p
                    JOIN message m ON m.participant_id = p.id
                    GROUP BY p.conversation_id
                    HAVING COUNT(m.id) >= 10
                ) AS convo_with_10_msgs ON convo_with_10_msgs.conversation_id = p1.conversation_id
                GROUP BY p1.user_id
                ORDER BY conversation_count DESC
                LIMIT 1;`
            const maxConversationsResult = await db.query(maxConversationsQuery, [])
            const maxConversations = maxConversationsResult.rows[0]?.conversation_count || 1
    
            // Get the number of likes the user has received
            const userLikesQuery = `
                SELECT MAX(likes_count) AS max_likes 
                FROM (SELECT COUNT(*) AS likes_count 
                FROM user_likes WHERE liked_user_id = $1 
                GROUP BY liked_user_id) AS likes_data`
            const userLikesResult = await db.query(userLikesQuery, [user_id])
            const userLikes = userLikesResult.rows[0]?.max_likes || 0

            const userDislikesQuery = `
                SELECT MAX(dislikes_count) AS max_dislikes 
                FROM (SELECT COUNT(*) AS dislikes_count 
                FROM user_dislikes WHERE disliked_user_id = $1 
                GROUP BY disliked_user_id) AS dislikes_data`
            const userDislikesResult = await db.query(userDislikesQuery, [user_id])
            const userDislikes = userDislikesResult.rows[0]?.max_dislikes || 0
    
            // Get the number of conversations with more than 10 messages the user is involved in
            const userConversationsQuery = `
                SELECT COUNT(DISTINCT p.conversation_id) AS user_conversations
                FROM participant p
                JOIN conversation c ON p.conversation_id = c.id AND c.fame_rate_updated = true
                JOIN (
                    SELECT p.conversation_id
                    FROM participant p
                    JOIN message m ON m.participant_id = p.id
                    GROUP BY p.conversation_id
                    HAVING COUNT(m.id) >= 10
                ) AS convo_with_10_msgs ON p.conversation_id = convo_with_10_msgs.conversation_id
                WHERE p.user_id = $1`
            const userConversationsResult = await db.query(userConversationsQuery, [user_id])
            const userConversations = userConversationsResult.rows[0]?.user_conversations || 0
            const calculatedFameRate = (0.6 * ((userLikes - userDislikes) / maxLikes)) +( 0.4 * (userConversations / maxConversations)) + 10;

            if (calculatedFameRate < 0) {
                const updateFameRateQuery = await db.query(`UPDATE users SET famerate = $1 WHERE id = $2`, [0, user_id])
            } else {
                const updateFameRateQuery = await db.query(`UPDATE users SET famerate = $1 WHERE id = $2`, [calculatedFameRate, user_id])
            }
        } catch (error) {
            console.error(`Error updating fameRate for user ${user_id}:`, error)
        }
    }
}

module.exports = filterController
