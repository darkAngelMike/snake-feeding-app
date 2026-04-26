const express = require("express");
const calculationController = require("../controllers/calculationController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/calculate", requireAuth, calculationController.calculate);

module.exports = router;
