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
}

module.exports = { Conversation };