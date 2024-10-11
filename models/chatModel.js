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

    getAllConversationsByUserId: async (user_id) => {
      try {
         const query = `
             SELECT DISTINCT
               p.conversation_id AS id,
               p2.user_id AS match_id,
               u.username AS username,
               up.photo_url AS photo,
               m.message_text AS last_message,
			   rt.name AS interested_in_relation
                  FROM participant p
				  JOIN interested_in_relation ur ON ur.user_id = p.user_id
				  LEFT JOIN relationship_type rt ON rt.id = ur.relationship_type_id
                  JOIN participant p2 ON p.conversation_id = p2.conversation_id  -- Joining with itself to get other participants in the same conversation
                  JOIN users u ON u.id = p2.user_id  -- Joining with users table to get the user details
                  LEFT JOIN user_photo up ON up.user_id = u.id AND up.active = true  -- Joining with user_photo to get active profile picture
                  LEFT JOIN LATERAL (  -- Using LATERAL to get the latest message for each conversation
                     SELECT message_text
                     FROM message m 
                     WHERE m.participant_id = p.id OR m.participant_id = p2.id 
                     ORDER BY m.ts DESC
                     LIMIT 1
                  ) m ON true  -- Lateral join to get the last message text
                  WHERE p.user_id = $1
                  AND p2.user_id != $1;
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