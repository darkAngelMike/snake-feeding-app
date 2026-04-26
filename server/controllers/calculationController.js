const { calculateFeeding } = require("../services/feedingService");
const feedingCalculationsRepository = require("../repositories/feedingCalculationsRepository");
const snakeProfilesRepository = require("../repositories/snakeProfilesRepository");
const logger = require("../utils/logger");

const CALCULATION_SAVE_ERROR = "Nie udało się zapisać kalkulacji";

function shouldSaveCalculation(payload) {
  return Boolean(payload.snake_id);
}

async function calculate(req, res) {
  try {
    const userId = req.user.id;
    const payload = {
      ...req.body,
      user_id: userId,
    };
    const calculation = calculateFeeding(payload);
    const responseBody = { ...calculation };

    if (!shouldSaveCalculation(payload)) {
      return res.json(responseBody);
    }

    const { data: snakeProfile, error: snakeProfileError } =
      await snakeProfilesRepository.findById(payload.snake_id);

    if (snakeProfileError) {
      logger.error("Nie udało się zweryfikować profilu węża", snakeProfileError);
      return res.status(500).json({
        error: "Błąd weryfikacji profilu węża",
      });
    }

    if (!snakeProfile || snakeProfile.user_id !== userId) {
      return res.status(403).json({
        error: "Brak dostępu do profilu węża",
      });
    }

    const { error } = await feedingCalculationsRepository.createCalculation({
      ...payload,
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
