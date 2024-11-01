const { findUserIdByEmail } = require("../db/helpers/functions");
const { Conversation } = require("../models/chatModel");
const jwt = require("jsonwebtoken");
const filterController = require("./filterController");
class ChatController {
    static async getConversationById(req, res) {
        const conversation_id = parseInt(req.params.id, 10);
        const io = req.app.get('socketio');
    try {
        
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
    static async addNewMessage(req, res) {
        const { participant_id, message_text, conversationId } = req.body;
        try {
            const newMessage = await Conversation.addMessage(participant_id, message_text, conversationId);
      
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
            const userBlocked = await Conversation.oneOfUsersBlockedTheOther(participant_id, user_id);
            if (userBlocked) {
                return res.status(201).json({
                    message: 'One of the users blocked the other',
                    data: [],
              });
            }
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
        const token = req.header("Authorization")?.replace("Bearer ", "");
		const { email } = jwt.decode(token);
        const user_id = await findUserIdByEmail(email);
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
        return res.status(200).json({shouldRedirect:false});
    }
}

module.exports = ChatController;
