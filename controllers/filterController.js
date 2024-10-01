const jwt = require("jsonwebtoken");
const db = require("../db/db");


class filterController {
    static filterMatches = async (req, res) => {
        const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
        const { ageGap, location, fameRate, interests } = req.query;
        let matches = [];
        if (!ageGap && !location && !fameRate && !interests) {
            const query = 
                `WITH user_location AS (
                    SELECT
                        split_part(location, ',', 1)::float AS user_latitude,
                        split_part(location, ',', 2)::float AS user_longitude
                    FROM users
                    WHERE email = 'ihssaneouardi2@gmail.com' 
                )
                SELECT 
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
                WHERE u.email != 'ihssaneouardi2@gmail.com' 
                AND u.setup_finished = true
                AND u.gender_id IN (
                    SELECT i2.gender_id
                    FROM interested_in_gender i2
                    JOIN users u2 ON u2.id = i2.user_id
                    WHERE u2.email = 'ihssaneouardi2@gmail.com' 
                )
                AND i.gender_id IN (
                    SELECT gender_id
                    FROM users u2
                    WHERE email = 'ihssaneouardi2@gmail.com' 
                )
                ORDER BY distance ASC;

                `;
            // const query = 
            //     `SELECT 
            //         u.id AS user_id,
            //         u.username AS username,
            //         u.birthday AS birthday,
            //         u.location AS location,
            //         i.gender_id as interested_in,
            //         u.gender_id as gender
            //         FROM users u
            //         LEFT JOIN interested_in_gender i ON i.user_id = u.id
            //         WHERE u.email != $1
            //         AND u.setup_finished = true
            //         AND u.gender_id IN (
            //         SELECT i2.gender_id
            //             FROM interested_in_gender i2
            //             JOIN users u2 ON u2.id = i2.user_id 
            //             WHERE u2.email = $1
            //     )
            //         AND i.gender_id IN (
            //             select gender_id
            //                 from users u2 
            //                 WHERE email = $1 
            //         )

            //     `;
            matches = await db.query(query, [email])
        }
        let minAge, maxAge;
        if (ageGap) {
            const [min, max] = ageGap.split('-').map(Number);
            minAge = min;
            maxAge = max;
        }

        const haversineFormula = `
            6371 * acos(
                cos(radians($2)) * cos(radians(split_part(u.location, ',', 1)::float)) *
                cos(radians(split_part(u.location, ',', 2)::float) - radians($3)) +
                sin(radians($2)) * sin(radians(split_part(u.location, ',', 1)::float))
            )
        `;

        let query = 
            `SELECT
                u.id AS user_id,
                u.firstname AS firstname,
                u.lastname AS lastname,
                u.username AS username,
                u.birthday AS birthday,
                u.location AS location,
                u.famerate AS famerate,
            array_agg(i.name) AS interests
            FROM users u
            join user_interests ui on u.id = ui.user_id
            join interests i on ui.interest_id = i.id WHERE email != $1 AND setup_finished = true GROUP BY u.id`;

            const params = [email];

            // if (location) {
            //     query += ` AND u.location = $2`;
            //     params.push(location);
            // }
        
            if (location) {
                query += ` AND ${haversineFormula} <= $2`;
                params.push(userLatitude, userLongitude, 50); // Radius in kilometers (adjust as needed)
            }
            // Add fameRate filter
            if (fameRate) {
                query += `AND u.fame_rate >= $${params.length + 1}`;
                params.push(Number(fameRate));
            }
        
            // Add age filtering if ageGap is provided
            if (ageGap) {
                query += ` AND DATE_PART('year', AGE(u.birthday)) BETWEEN $4 AND $5`;
                params.push(minAge, maxAge);
            }
        
            // Add GROUP BY and filtering by interests (if any)
            query += ` GROUP BY u.id`;
        
            // if (interests) {
            //     const interestsArray = interests.split(',');
            //     query += ` HAVING array_agg(i.name) && $6::text[]`;
            //     params.push(interestsArray);
            // }

            try {
                const users = await db.query(query, params);
                const results = users.rows;
                res.json({ message: "Filtered matches result", matches: results });
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Server error" });
            }
      };
}

module.exports = filterController;