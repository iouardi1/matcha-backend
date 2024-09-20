const express = require("express");
const router = express.Router();
const ChatController = require("../controllers/chatController");
require("dotenv").config();

router.get("/", ChatController.test);
router.get("/:id", ChatController.getConversationById);
router.post("/addNewMessage", ChatController.addNewMessage);
router.post("/initiateNewDM", ChatController.initiateNewDM);
router.get("/getAllConversations/:user_id", ChatController.getConversations);

module.exports = router;