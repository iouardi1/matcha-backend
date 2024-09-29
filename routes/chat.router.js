const express = require("express");
const router = express.Router();
const ChatController = require("../controllers/chatController");
require("dotenv").config();
const socketMiddleware = require('../middlewares/socketMiddleware');

router.get("/", ChatController.test);
router.post("/addNewMessage", ChatController.addNewMessage);
router.post("/initiateNewDM", ChatController.initiateNewDM);
router.get("/fetchMessages/:id", ChatController.getConversationById);
router.get("/getAllConversations", ChatController.getConversations);
    

module.exports = router