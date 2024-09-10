const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profileController");
require("dotenv").config();

router.get("/", ProfileController.getProfileDetails);
router.post("/setup", ProfileController.setupProfile);
router.get("/setup", ProfileController.getSetupProfile);
router.get("/getProfileInfos", ProfileController.getProfileInfos)

module.exports = router;
