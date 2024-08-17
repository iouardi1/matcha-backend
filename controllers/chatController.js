const { Conversation } = require("../models/chatModel");

class ChatController {
    static async getConversationById(req, res) {
        try {
            const conversation_id = parseInt(req.params.id, 10);
            
            if (!conversation_id) {
                return res.status(400).json({ error: 'Conversation ID is required' });
            }
            const messages = await Conversation.getMessagesWithParticipants(conversation_id);
            
            return res.status(200).json(messages);
        } catch (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ err: 'Internal Server Error' });
        }
    }
}

module.exports = ChatController;
