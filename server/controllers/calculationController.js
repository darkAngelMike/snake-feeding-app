const { calculateFeeding } = require("../services/feedingService");
const feedingCalculationsRepository = require("../repositories/feedingCalculationsRepository");
const logger = require("../utils/logger");

const CALCULATION_SAVE_ERROR = "Nie udało się zapisać kalkulacji";

function shouldSaveCalculation(payload) {
  return Boolean(payload.user_id && payload.snake_id);
}

async function calculate(req, res) {
  try {
    const calculation = calculateFeeding(req.body);
    const responseBody = { ...calculation };

    if (!shouldSaveCalculation(req.body)) {
      return res.json(responseBody);
    }

    const { error } = await feedingCalculationsRepository.createCalculation({
      ...req.body,
      ...calculation.result,
    });

    if (error) {
      logger.error("Nie udało się zapisać kalkulacji karmienia", error);
      return res.json({
        ...responseBody,
        calculationSaved: false,
        calculationSaveError: CALCULATION_SAVE_ERROR,
      });
    }

    return res.json({
      ...responseBody,
      calculationSaved: true,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

module.exports = {
  calculate,
};
