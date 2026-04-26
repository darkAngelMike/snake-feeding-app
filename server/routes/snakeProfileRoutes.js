const express = require("express");
const snakeProfileController = require("../controllers/snakeProfileController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/snake-profiles", requireAuth, snakeProfileController.getProfiles);
router.get("/snake-profiles/:id", requireAuth, snakeProfileController.getProfile);
router.post("/snake-profiles", requireAuth, snakeProfileController.createProfile);
router.patch(
  "/snake-profiles/:id",
  requireAuth,
  snakeProfileController.updateProfile,
);

module.exports = router;
