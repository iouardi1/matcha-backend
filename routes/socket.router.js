const ChatController = require("../controllers/chatController");
const { Conversation } = require("../models/chatModel");

require("dotenv").config();

module.exports = (io) => {
    io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle joining a conversation room
    socket.on("join conversation", (conversationId) => {
        socket.join(`room${conversationId}`);
        console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on("leave conversation", (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${socket.id} left conversation ${conversationId}`);
    });

    // Handle receiving a new message
    socket.on("new message", async (messageData) => {
        const { conversationId, message_text, participant_id } = messageData;
        const newMessage = await Conversation.addMessage(participant_id, message_text, conversationId);

        // Emit the message to all users in the conversation room
        io.to(`room${conversationId}`).emit("message received", {
        participant_id,
        conversationId,
        message_text,
        timestamp: new Date(),
        });

        console.log(`New message in conversation ${conversationId}: ${message_text}`);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
    });
  };