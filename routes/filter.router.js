const express = require("express");
const router = express.Router();
const filterController = require("../controllers/filterController");
require("dotenv").config();

router.get("/", filterController.filterMatches);
router.post("/swipeRight", filterController.swipeRight);
router.post("/swipeLeft", filterController.swipeLeft);
router.post("/blockUser", filterController.blockUser);

module.exports = router;
