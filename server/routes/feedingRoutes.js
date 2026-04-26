const express = require("express");
const feedingController = require("../controllers/feedingController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/feedings", requireAuth, feedingController.getFeedings);
router.post("/feedings", requireAuth, feedingController.createFeeding);
router.get("/history", feedingController.getHistory);

module.exports = router;
