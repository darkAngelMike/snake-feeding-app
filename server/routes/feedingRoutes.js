const express = require("express");
const feedingController = require("../controllers/feedingController");

const router = express.Router();

router.get("/history", feedingController.getHistory);

module.exports = router;
