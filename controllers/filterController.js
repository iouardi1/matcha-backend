const jwt = require("jsonwebtoken");
const db = require("../db/db");


class filterController {
    static filterMatches = async (req, res) => {
        const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
        const { ageGap, location, fameRate } = req.query;
        // il faut filterer les matches existant deja
        let query = 
                `WITH user_location AS (
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
                `;
    const params = [email];
    let paramIndex = 2;

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
        `;
        params.push(location);
        paramIndex++;
    }

    if (fameRate) {
        query += ` AND u.famerate >= $${paramIndex}`;
        params.push(Number(fameRate));
        paramIndex++;
    }

    if (ageGap) {
        const [minAge, maxAge] = ageGap.split('-').map(Number);
        query += ` AND DATE_PART('year', AGE(u.birthday)) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(minAge, maxAge);
        paramIndex += 2;
    }

    // End the query
    query += ` ORDER BY u.id, distance ASC;`;

    try {
        const users = await db.query(query, params);
        const results = users.rows;
        return res.json({ message: "Filtered matches result", matches: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
        }
    };
}

module.exports = filterController;