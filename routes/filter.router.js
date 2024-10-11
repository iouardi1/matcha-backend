const express = require("express");
const router = express.Router();
const filterController = require("../controllers/filterController");
require("dotenv").config();

router.get("/", filterController.filterMatches);
router.post("/swipeRight", filterController.swipeRight);

module.exports = router;
