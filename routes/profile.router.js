const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/profileController");
require("dotenv").config();

router.get("/", ProfileController.getProfileDetails);
router.get("/setupData", ProfileController.setupData);
router.post("/setup", ProfileController.setupProfile);
router.get("/setup", ProfileController.getSetupProfile);
router.get("/getProfileInfos", ProfileController.getProfileInfos)
router.get("/getListOfMatches", ProfileController.getListOfMatches)

module.exports = router;
