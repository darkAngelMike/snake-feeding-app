const express = require("express");
const calculationController = require("../controllers/calculationController");

const router = express.Router();

router.post("/calculate", calculationController.calculate);

module.exports = router;
