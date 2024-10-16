const ChatController = require('../controllers/chatController')
const {
    findUsernameIdByEmail,
    getNotifSenderData,
} = require('../db/helpers/functions')
const { Conversation } = require('../models/chatModel')
const SECRET_KEY = process.env.JWT_SECRET
const jwt = require('jsonwebtoken')

require('dotenv').config()

const userSocketMap = new Map()

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token
        try {
            const decoded = jwt.verify(token, SECRET_KEY)
            socket.email = decoded.email
            next()
        } catch (error) {
            console.log(error)
            return next(new Error('Authentication error'))
        }
    })

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`)
        userSocketMap.set(socket.email, socket.id)

        socket.on('join conversation', (conversationId) => {
            socket.join(`room${conversationId}`)
            console.log(
                `User ${socket.id} joined conversation ${conversationId}`
            )
        })

        socket.on('leave conversation', (conversationId) => {
            socket.leave(conversationId)
            console.log(`User ${socket.id} left conversation ${conversationId}`)
        })

        // Handle receiving a new message
        socket.on('new message', async (messageData) => {
            const { conversationId, message_text, participant_id } = messageData
            const newMessage = await Conversation.addMessage(
                participant_id,
                message_text,
                conversationId
            )

            // Emit the message to all users in the conversation room
            io.to(`room${conversationId}`).emit('message received', {
                participant_id,
                conversationId,
                message_text,
                timestamp: new Date(),
            })

            console.log(
                `New message in conversation ${conversationId}: ${message_text}`
            )
        })

        //notification
        socket.on('send notif', async (notifData) => {
            const receiver = userSocketMap.get(notifData.user)
            // const sender = await findUsernameIdByEmail(socket.email)
            const senderData = await getNotifSenderData(socket.email)
            const data = {
                sender: senderData[0].sender,
                type: notifData.notifType,
                profile_picture: senderData[0].profile_picture,
            }
            io.to(receiver).emit('notif received', data)
        })

        // Handle user disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`)
            userSocketMap.delete(socket.email)
        })
    })
}
