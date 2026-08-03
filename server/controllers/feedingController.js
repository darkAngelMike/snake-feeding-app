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
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (payload.feeding_date > today) {
      errors.push("feeding_date nie może być w przyszłości");
    }
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

function buildWeightAssessment(feedings) {
  const weights = (feedings || [])
    .map((feeding) => Number(feeding.snake_weight_g))
    .filter((weight) => Number.isFinite(weight));

  const latestWeight = weights[0];

  if (latestWeight < 50) {
    return {
      status: "invalid",
      severity: "danger",
      changePercent: null,
      message: "Waga jest poza realistycznym zakresem.",
    };
  }

  if (latestWeight >= 5000) {
    return {
      status: "overweight_alert",
      severity: "warning",
      changePercent: null,
      message:
        "Waga jest bardzo wysoka jak na pytona królewskiego. Sprawdź kondycję i nie przekarmiaj.",
    };
  }

  if (weights.length < 2) {
    return {
      status: "unknown",
      severity: "neutral",
      changePercent: null,
      message: "Brak wystarczającej historii do oceny trendu masy.",
    };
  }

  const previousWeight = weights[1];

  if (!previousWeight) {
    return {
      status: "unknown",
      severity: "neutral",
      changePercent: null,
      message: "Brak wystarczającej historii do oceny trendu masy.",
    };
  }

  const changePercent = Number(
    (((latestWeight - previousWeight) / previousWeight) * 100).toFixed(1),
  );

  if (changePercent < -8) {
    return {
      status: "weight_loss",
      severity: "danger",
      changePercent,
      message:
        "Masa węża wyraźnie spadła. Sprawdź karmienie i rozważ konsultację ze specjalistą.",
    };
  }

  if (changePercent > 10) {
    return {
      status: "rapid_gain",
      severity: "warning",
      changePercent,
      message: "Masa szybko rośnie. Uważaj na przekarmianie.",
    };
  }

  return {
    status: "stable",
    severity: "success",
    changePercent,
    message: "Masa węża wygląda stabilnie.",
  };
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

  return res.json({
    success: true,
    data: (data || []).map(sanitizeFeeding),
    weightAssessment: buildWeightAssessment(data || []),
  });
}

async function syncSnakeProfileFromFeedings(snakeId, supabaseClient) {
  const { data: feedings, error } = await feedingsRepository.getBySnakeId(
    snakeId,
    supabaseClient,
  );

  if (error || !feedings) {
    logger.error("Nie udało się pobrać karmień do synchronizacji profilu", {
      error,
      snakeId,
    });
    return false;
  }

  const successfulFeedings = (feedings || [])
    .filter((f) => f.status === "success")
    .sort((a, b) => (a.feeding_date < b.feeding_date ? 1 : -1));

  if (successfulFeedings.length === 0) {
    return true;
  }

  const latest = successfulFeedings[0];

  const { error: updateError } = await snakeProfilesRepository.updateProfile(
    snakeId,
    {
      current_weight_g: latest.snake_weight_g,
      last_successful_feeding_date: latest.feeding_date,
    },
    supabaseClient,
  );

  if (updateError) {
    logger.error("Nie udało się zaktualizować profilu z najnowszego karmienia", {
      error: updateError,
      snakeId,
    });
    return false;
  }

  return true;
}

async function updateSnakeProfileAfterFeeding(feeding) {
  return syncSnakeProfileFromFeedings(
    feeding.snake_id,
    feeding.supabaseClient,
  );
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

async function deleteFeeding(req, res) {
  const userId = req.user.id;
  const { data: feeding, error: findError } = await feedingsRepository.findById(
    req.params.id,
    req.supabase,
  );

  if (findError) {
    logger.error("Nie udało się zweryfikować karmienia", findError);
    return res.status(isPermissionError(findError) ? 403 : 500).json({
      error: isPermissionError(findError)
        ? "Brak dostępu do karmienia"
        : "Błąd weryfikacji karmienia",
    });
  }

  if (!feeding || feeding.user_id !== userId) {
    return res.status(403).json({
      error: "Brak dostępu do karmienia",
    });
  }

  const { data, error } = await feedingsRepository.deleteFeeding(
    req.params.id,
    req.supabase,
  );

  if (error) {
    logger.error("Nie udało się usunąć karmienia", error);
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak uprawnień do usunięcia karmienia"
        : "Nie udało się usunąć karmienia",
    });
  }

  await syncSnakeProfileFromFeedings(feeding.snake_id, req.supabase);

  return res.json({
    success: true,
    message: "Wpis karmienia został usunięty",
    data: sanitizeFeeding(data),
  });
}

async function updateFeeding(req, res) {
  const userId = req.user.id;
  const { data: existingFeeding, error: findError } =
    await feedingsRepository.findById(req.params.id, req.supabase);

  if (findError) {
    logger.error("Nie udało się zweryfikować karmienia", findError);
    return res.status(isPermissionError(findError) ? 403 : 500).json({
      error: isPermissionError(findError)
        ? "Brak dostępu do karmienia"
        : "Błąd weryfikacji karmienia",
    });
  }

  if (!existingFeeding || existingFeeding.user_id !== userId) {
    return res.status(403).json({
      error: "Brak dostępu do karmienia",
    });
  }

  const payload = req.body || {};
  const updates = {};

  if (payload.feeding_date !== undefined) {
    if (!isValidDateOnly(payload.feeding_date)) {
      return res.status(400).json({
        error: "Niepoprawne dane karmienia",
        details: ["feeding_date musi mieć format YYYY-MM-DD i być poprawną datą"],
      });
    }
    updates.feeding_date = payload.feeding_date;
  }

  if (payload.snake_weight_g !== undefined) {
    const weight = toPositiveInteger(payload.snake_weight_g);
    if (!weight) {
      return res.status(400).json({
        error: "Niepoprawne dane karmienia",
        details: ["snake_weight_g musi być dodatnią liczbą całkowitą"],
      });
    }
    updates.snake_weight_g = weight;
  }

  if (payload.meal_weight_g !== undefined) {
    const meal = toPositiveInteger(payload.meal_weight_g);
    if (!meal) {
      return res.status(400).json({
        error: "Niepoprawne dane karmienia",
        details: ["meal_weight_g musi być dodatnią liczbą całkowitą"],
      });
    }
    updates.meal_weight_g = meal;
  }

  if (payload.status !== undefined) {
    const status = normalizeStatus(payload.status);
    if (!VALID_FEEDING_STATUSES.has(status)) {
      return res.status(400).json({
        error: "Niepoprawne dane karmienia",
        details: ["status musi mieć jedną z wartości: success, refused, skipped"],
      });
    }
    updates.status = status;
  }

  const { data, error } = await feedingsRepository.updateFeeding(
    req.params.id,
    updates,
    req.supabase,
  );

  if (error) {
    logger.error("Nie udało się zaktualizować wpisu karmienia", error);
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak uprawnień do aktualizacji karmienia"
        : "Nie udało się zaktualizować wpisu karmienia",
    });
  }

  await syncSnakeProfileFromFeedings(existingFeeding.snake_id, req.supabase);

  return res.json({
    success: true,
    data: sanitizeFeeding(data),
  });
}

module.exports = {
  createFeeding,
  deleteFeeding,
  getFeedings,
  updateFeeding,
};
