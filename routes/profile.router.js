const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profileController");
require("dotenv").config();

router.get("/", ProfileController.getProfileDetails)

module.exports = router;