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
    static async addNewMessage(messageData) {
        const { participant_id, message_text } = messageData;
        try {
            const newMessage = await Conversation.addMessage(participant_id, message_text);
      
          // Send the new message data back to the client
          return res.status(201).json({
            message: 'Message sent successfully',
            data: newMessage,
          });
        } catch (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ err: 'Internal Server Error' });
        }
    }
    static async initiateNewDM(req, res) {
        const { participant_id, user_id } = req.body;
        try {
            const dmAlreadyInitiated = await Conversation.chatAlreadyExists(participant_id, user_id)
            if (dmAlreadyInitiated) {
                return res.status(201).json({
                    message: 'DM already initiated',
                    data: dmAlreadyInitiated,
              });
            }
            const newDM = await Conversation.addNewDM(participant_id, user_id);
            return res.status(201).json({
                message: 'DM created successfully',
                data: newDM,
          });
        } catch (err) {
            console.error('Error creating new dm:', err);
            return res.status(500).json({ err: 'Internal Server Error' });
        }
    }

    static async getConversations(req, res) {
        const user_id = parseInt(req.params.user_id, 10);
        try {
            const conversations = await Conversation.getAllConversationsByUserId(user_id);
            return res.status(201).json({
                message: 'all conversations are fetched successfully',
                data: conversations,
          });
        } catch (err) {
            console.error('Error fetching conversations:', err);
            return res.status(500).json({ err: 'Internal Server Error' });
        }
    }

    static async test(req, res) {
        // return res.status(200).json({shouldRedirect:false});
        return res.status(200).json();
    }
}

module.exports = ChatController;
