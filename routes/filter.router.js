const express = require("express");
const router = express.Router();
const filterController = require("../controllers/filterController");
require("dotenv").config();

router.get("/", filterController.filterMatches);

module.exports = router;
