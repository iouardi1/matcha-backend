const express = require("express");
const router = express.Router();
const ChatController = require("../controllers/chatController");
require("dotenv").config();

router.get("/:id", ChatController.getConversationById);

module.exports = router;