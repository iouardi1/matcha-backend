const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profileController");
require("dotenv").config();

router.get("/", ProfileController.getProfile);
router.get("/details", ProfileController.getProfileDetails);
router.get("/setupData", ProfileController.setupData);
router.post("/setup", ProfileController.setupProfile);
router.get("/setup", ProfileController.getSetupProfile);
router.get("/getProfileInfos", ProfileController.getProfileInfos)
router.get("/getListOfMatches", ProfileController.getListOfMatches)
router.get("/getListOfNotifications", ProfileController.getListOfNotif)
router.post("/createNotification", ProfileController.createNotif)
router.put("/updateProfile", ProfileController.updateProfile)

module.exports = router;
