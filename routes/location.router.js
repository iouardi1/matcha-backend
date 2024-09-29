const express = require("express");
const locationController = require("../controllers/locationController");
const router = express.Router();
require("dotenv").config();

router.get("/", locationController.getLocation);
router.post("/", locationController.saveLocation);

module.exports = router;
