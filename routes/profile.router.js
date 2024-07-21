const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profileController");
const extractToken = require("../middlewares/extractToken")
require("dotenv").config();

module.exports = router;