const feedingsRepository = require("../repositories/feedingsRepository");
const snakeProfilesRepository = require("../repositories/snakeProfilesRepository");
const logger = require("../utils/logger");
const { isPermissionError } = require("../utils/supabaseErrors");

const VALID_FEEDING_STATUSES = new Set(["success", "refused", "skipped"]);
const LEGACY_STATUS_MAP = {
  ok: "success",
  completed: "success",
  done: "success",
  failed: "refused",
  reject: "refused",
  rejected: "refused",
  skip: "skipped",
};

function normalizeStatus(status) {
  if (!status) return "success";

  const normalized = String(status).trim().toLowerCase();
  return LEGACY_STATUS_MAP[normalized] || normalized;
}

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function validateFeedingPayload(payload, userId) {
  const errors = [];
  const status = normalizeStatus(payload.status);
  const snakeWeightG = toPositiveInteger(payload.snake_weight_g);
  const mealWeightG = toPositiveInteger(payload.meal_weight_g);

  if (!payload.snake_id) errors.push("snake_id jest wymagane");
  if (!isValidDateOnly(payload.feeding_date)) {
    errors.push("feeding_date musi mieć format YYYY-MM-DD i być poprawną datą");
  }
  if (!snakeWeightG) {
    errors.push("snake_weight_g musi być dodatnią liczbą całkowitą");
  }
  if (!mealWeightG) {
    errors.push("meal_weight_g musi być dodatnią liczbą całkowitą");
  }
  if (snakeWeightG && mealWeightG && mealWeightG > snakeWeightG) {
    errors.push("meal_weight_g nie może być większe niż snake_weight_g");
  }
  if (!VALID_FEEDING_STATUSES.has(status)) {
    errors.push(
      "status musi mieć jedną z wartości: success, refused, skipped",
    );
  }

  return {
    errors,
    feeding: {
      user_id: userId,
      snake_id: payload.snake_id,
      feeding_date: payload.feeding_date,
      snake_weight_g: snakeWeightG,
      meal_weight_g: mealWeightG,
      status,
    },
  };
}

function sanitizeFeeding(feeding) {
  if (!feeding) return feeding;

  const { user_id: _userId, ...safeFeeding } = feeding;
  return safeFeeding;
}

async function getHistory(_req, res) {
  const { data, error } = await feedingsRepository.getHistory();

  if (error) {
    logger.error("Nie udało się pobrać historii karmień", error);
    return res.status(500).json({
      error: "Błąd pobierania historii",
    });
  }

  return res.json(data || []);
}

async function getFeedings(req, res) {
  const { snake_id: snakeId } = req.query;
  const userId = req.user.id;

  if (!snakeId) {
    return res.status(400).json({
      error: "snake_id jest wymagane",
    });
  }

  const { data: snakeProfile, error: snakeProfileError } =
    await snakeProfilesRepository.findById(snakeId, req.supabase);

  if (snakeProfileError) {
    logger.error("Nie udało się zweryfikować profilu węża", snakeProfileError);
    return res.status(isPermissionError(snakeProfileError) ? 403 : 500).json({
      error: isPermissionError(snakeProfileError)
        ? "Brak dostępu do profilu węża"
        : "Błąd weryfikacji profilu węża",
    });
  }

  if (!snakeProfile || snakeProfile.user_id !== userId) {
    return res.status(403).json({
      error: "Brak dostępu do profilu węża",
    });
  }

  const { data, error } = await feedingsRepository.getBySnakeId(
    snakeId,
    req.supabase,
  );

  if (error) {
    logger.error("Nie udało się pobrać karmień", {
      error,
      snake_id: snakeId,
    });
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak dostępu do karmień"
        : "Błąd pobierania karmień",
    });
  }

  return res.json((data || []).map(sanitizeFeeding));
}

async function updateSnakeProfileAfterFeeding(feeding) {
  const weightUpdate = await snakeProfilesRepository.updateWeight(
    feeding.snake_id,
    feeding.snake_weight_g,
    feeding.supabaseClient,
  );

  if (weightUpdate.error) {
    logger.error("Nie udało się zaktualizować wagi profilu po karmieniu", {
      error: weightUpdate.error,
      snake_id: feeding.snake_id,
      feeding_date: feeding.feeding_date,
      snake_weight_g: feeding.snake_weight_g,
    });
    return false;
  }

  if (feeding.status !== "success") {
    return true;
  }

  const lastFeedingUpdate =
    await snakeProfilesRepository.updateLastFeedingDate(
      feeding.snake_id,
      feeding.feeding_date,
      feeding.supabaseClient,
    );

  if (lastFeedingUpdate.error) {
    logger.error(
      "Nie udało się zaktualizować daty ostatniego udanego karmienia",
      {
        error: lastFeedingUpdate.error,
        snake_id: feeding.snake_id,
        feeding_date: feeding.feeding_date,
      },
    );
    return false;
  }

  return true;
}

async function createFeeding(req, res) {
  const userId = req.user.id;
  const { errors, feeding } = validateFeedingPayload(req.body || {}, userId);

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Niepoprawne dane karmienia",
      details: errors,
    });
  }

  const { data: snakeProfile, error: snakeProfileError } =
    await snakeProfilesRepository.findById(feeding.snake_id, req.supabase);

  if (snakeProfileError) {
    logger.error("Nie udało się zweryfikować profilu węża", snakeProfileError);
    return res.status(isPermissionError(snakeProfileError) ? 403 : 500).json({
      error: isPermissionError(snakeProfileError)
        ? "Brak dostępu do profilu węża"
        : "Błąd weryfikacji profilu węża",
    });
  }

  if (!snakeProfile || snakeProfile.user_id !== userId) {
    return res.status(403).json({
      error: "Brak dostępu do profilu węża",
    });
  }

  const { data, error } = await feedingsRepository.insertFeeding(
    feeding,
    req.supabase,
  );

  if (error) {
    logger.error("Nie udało się zapisać karmienia", error);
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak uprawnień do zapisu karmienia"
        : "Nie udało się zapisać karmienia",
    });
  }

  const profileUpdated = await updateSnakeProfileAfterFeeding({
    ...feeding,
    supabaseClient: req.supabase,
  });

  return res.status(201).json({
    success: true,
    feeding: sanitizeFeeding(data),
    profileUpdated,
  });
}

module.exports = {
  createFeeding,
  getFeedings,
  getHistory,
};
