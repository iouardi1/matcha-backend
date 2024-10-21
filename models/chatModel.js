const db = require("../db/db");

const Conversation = {
    getMessagesWithParticipants: async (conversation_id) => {
        try {
            const result = await db.query(
               `SELECT 
                    m.id AS message_id,
                    m.message_text,
                    m.ts AS timestamp,
                    p.user_id AS sender_id,
                    u.firstname AS sender_firstname,
                    u.lastname AS sender_lastname
                 FROM 
                    public.message m
                 JOIN 
                    public.participant p ON m.participant_id = p.id
                 JOIN 
                    public.users u ON p.user_id = u.id
                 WHERE 
                    p.conversation_id = $1
                 ORDER BY 
                    m.ts ASC`,
                [conversation_id]
            );  
            return result.rows; // Return array of messages with sender details
        } catch (error) {
            console.error("Error fetching conversation messages:", error);
            throw error;
        }
    },

    addMessage: async (participant_id, message_text, conversationId) => {
      try {
         const participant =  await db.query(
            `SELECT p.id as participant_id FROM participant p where p.user_id = ${participant_id} AND p.conversation_id = ${conversationId}`
         )
         const result = await db.query(
            `INSERT INTO public.message (participant_id, message_text, ts)
             VALUES ($1, $2, NOW())
             RETURNING id, participant_id, message_text, ts`,
            [participant.rows[0].participant_id, message_text]
          );
          return result.rows[0]
      } catch (error) {
         console.error("Error fetching conversation messages:", error);
         throw error;
     }
    },
    
    addNewDM: async (participant_id, user_id) => {
      try {
          const conversationQuery = `
              INSERT INTO conversation (user_id, time_started, time_ended)
              VALUES ($1, NOW(), null)
              RETURNING id;
          `;
          const conversationValues = [user_id];
  
          const conversationResult = await db.query(conversationQuery, conversationValues);
          const conversationId = conversationResult.rows[0].id;
  
          const participantQuery = `
              INSERT INTO participant (user_id, conversation_id, time_joined)
              VALUES ($1, $2, NOW());
          `;
          const participant1Values = [participant_id, conversationId];
          const participant2Values = [user_id, conversationId];
  
          await db.query(participantQuery, participant1Values);
          await db.query(participantQuery, participant2Values);
  
          // Return the new conversation details
          return { id: conversationId, user_id, participant_id };
  
      } catch (error) {
          console.error("Error creating new DM:", error);
          throw error;
      }
  },
    chatAlreadyExists: async (participant_id, user_id) => {
      try {
         const query = `
            SELECT c.id 
            FROM conversation c
            JOIN participant p ON p.conversation_id = c.id
            WHERE (c.user_id = $1 AND p.user_id = $2)
            OR (c.user_id = $2 AND p.user_id = $1)
      `  ;

            const values = [user_id, participant_id];

            const result = await db.query(query, values);

            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        
      } catch (error) {
         console.error("Error fetching conversation messages:", error);
         throw error;
     }
    },
    oneOfUsersBlockedTheOther: async (participant_id, user_id) => {
      try {
         const query = `
             SELECT *
                FROM user_blocks ub
                WHERE (ub.blocker_id = $1 AND ub.blocked_user_id = $2)
                OR (ub.blocker_id = $2 AND ub.blocked_user_id = $1)
      `  ;

            const values = [user_id, participant_id];

            const result = await db.query(query, values);

            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        
      } catch (error) {
         console.error("Error fetching conversation messages:", error);
         throw error;
     }
    },

    getAllConversationsByUserId: async (user_id) => {
      try {
         const query = `
            WITH user_location AS (
                        SELECT
                            split_part(location, ',', 1)::float AS user_latitude,
                            split_part(location, ',', 2)::float AS user_longitude
                        FROM users
                        WHERE id = $1
                    )
            SELECT DISTINCT
                p.conversation_id AS id,
                p2.user_id AS match_id,
                u.username AS username,
                up.photo_url AS photo,
                m.message_text AS last_message,
                m.ts AS last_message_at,
                rt.name AS interested_in_relation,
                um.matched_at AS RealMatchingDate,
                CASE
                    WHEN DATE(m.ts) = CURRENT_DATE THEN TO_CHAR(m.ts, 'HH24:MI')  -- Same day: Hour:Minute
                    WHEN EXTRACT(YEAR FROM m.ts) = EXTRACT(YEAR FROM CURRENT_DATE) THEN TO_CHAR(m.ts, 'DD Month')  -- Same year: Day Month
                    ELSE TO_CHAR(m.ts, 'DD Month YYYY')  -- Different year: Day Month Year
                END AS matchingDate,
                DATE_PART('year', AGE(u.birthday)) AS age,
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
            FROM participant p
            JOIN interested_in_relation ur ON ur.user_id = p.user_id
            JOIN user_location ON true
            LEFT JOIN relationship_type rt ON rt.id = ur.relationship_type_id
            JOIN participant p2 ON p.conversation_id = p2.conversation_id  -- Joining with itself to get other participants in the same conversation
            JOIN users u ON u.id = p2.user_id  -- Joining with users table to get the user details
            LEFT JOIN user_photo up ON up.user_id = u.id AND up.active = true  -- Joining with user_photo to get active profile picture
            LEFT JOIN LATERAL (  -- Using LATERAL to get the latest message for each conversation
                SELECT message_text, ts
                    FROM message m 
                    WHERE m.participant_id = p.id OR m.participant_id = p2.id 
                    ORDER BY m.ts DESC
                    LIMIT 1
                ) m ON true  -- Lateral join to get the last message text
                LEFT JOIN user_blocks b1 ON b1.blocker_id = $1 AND b1.blocked_user_id = p2.user_id
                LEFT JOIN user_blocks b2 ON b2.blocker_id = p2.user_id AND b2.blocked_user_id = $1
                LEFT JOIN user_matches um ON um.user1_id = u.id OR um.user2_id = u.id
                WHERE p.user_id = $1
                    AND p2.user_id != $1
                    AND b1.blocked_user_id IS NULL  -- Exclude conversations where the current user blocked the other participant
                    AND b2.blocked_user_id IS NULL
            ORDER BY m.ts DESC; 
         `;
         const values = [user_id];
         const result = await db.query(query, values);
   
         // If no conversations are found, return an empty array
         if (result.rows.length === 0) {
            // console.log('No conversations found for user.');
            return [];
         }
   
         return result.rows;
         
      } catch (error) {
          console.error("Error fetching conversations:", error);
          throw error;
      }
  },
}

module.exports = { Conversation };