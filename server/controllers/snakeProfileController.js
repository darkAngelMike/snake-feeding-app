const snakeProfilesRepository = require("../repositories/snakeProfilesRepository");
const logger = require("../utils/logger");
const { isPermissionError } = require("../utils/supabaseErrors");

const VALID_LIFE_STAGES = new Set(["hatchling", "juvenile", "subadult", "adult"]);
const VALID_BODY_CONDITIONS = new Set([
  "underweight",
  "normal",
  "overweight",
]);

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

function sanitizeProfile(profile) {
  if (!profile) return profile;

  const { user_id: _userId, ...safeProfile } = profile;
  return safeProfile;
}

function validateProfilePayload(payload, { partial = false } = {}) {
  const errors = [];
  const profile = {};

  if (!partial || payload.name !== undefined) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name) {
      errors.push("name jest wymagane");
    } else {
      profile.name = name;
    }
  }

  if (!partial || payload.current_weight_g !== undefined) {
    const currentWeightG = toPositiveInteger(payload.current_weight_g);
    if (!currentWeightG) {
      errors.push("current_weight_g musi być dodatnią liczbą całkowitą");
    } else {
      profile.current_weight_g = currentWeightG;
    }
  }

  if (!partial || payload.life_stage !== undefined) {
    if (!VALID_LIFE_STAGES.has(payload.life_stage)) {
      errors.push(
        "life_stage musi mieć jedną z wartości: hatchling, juvenile, subadult, adult",
      );
    } else {
      profile.life_stage = payload.life_stage;
    }
  }

  if (!partial || payload.body_condition !== undefined) {
    if (!VALID_BODY_CONDITIONS.has(payload.body_condition)) {
      errors.push(
        "body_condition musi mieć jedną z wartości: underweight, normal, overweight",
      );
    } else {
      profile.body_condition = payload.body_condition;
    }
  }

  if (payload.last_successful_feeding_date !== undefined) {
    if (
      payload.last_successful_feeding_date !== null &&
      payload.last_successful_feeding_date !== "" &&
      !isValidDateOnly(payload.last_successful_feeding_date)
    ) {
      errors.push(
        "last_successful_feeding_date musi mieć format YYYY-MM-DD albo być puste",
      );
    } else if (payload.last_successful_feeding_date) {
      profile.last_successful_feeding_date = payload.last_successful_feeding_date;
    } else {
      profile.last_successful_feeding_date = null;
    }
  }

  return { errors, profile };
}

async function getProfiles(req, res) {
  const { data, error } = await snakeProfilesRepository.findByUserId(
    req.user.id,
    req.supabase,
  );

  if (error) {
    logger.error("Nie udało się pobrać profili węży", error);
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak dostępu do profili węży"
        : "Błąd pobierania profili węży",
    });
  }

  return res.json((data || []).map(sanitizeProfile));
}

async function getProfile(req, res) {
  const { data, error } = await snakeProfilesRepository.findById(
    req.params.id,
    req.supabase,
  );

  if (error) {
    logger.error("Nie udało się pobrać profilu węża", error);
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak dostępu do profilu węża"
        : "Błąd pobierania profilu węża",
    });
  }

  if (!data || data.user_id !== req.user.id) {
    return res.status(403).json({
      error: "Brak dostępu do profilu węża",
    });
  }

  return res.json(sanitizeProfile(data));
}

async function createProfile(req, res) {
  const { errors, profile } = validateProfilePayload(req.body || {});

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Niepoprawne dane profilu węża",
      details: errors,
    });
  }

  const { data, error } = await snakeProfilesRepository.createProfile({
    ...profile,
    user_id: req.user.id,
  }, req.supabase);

  if (error) {
    logger.error("Nie udało się utworzyć profilu węża", error);
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak uprawnień do utworzenia profilu węża"
        : "Nie udało się utworzyć profilu węża",
    });
  }

  return res.status(201).json(sanitizeProfile(data));
}

async function updateProfile(req, res) {
  const { errors, profile } = validateProfilePayload(req.body || {}, {
    partial: true,
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Niepoprawne dane profilu węża",
      details: errors,
    });
  }

  const { data: existingProfile, error: findError } =
    await snakeProfilesRepository.findById(req.params.id, req.supabase);

  if (findError) {
    logger.error("Nie udało się zweryfikować profilu węża", findError);
    return res.status(isPermissionError(findError) ? 403 : 500).json({
      error: isPermissionError(findError)
        ? "Brak dostępu do profilu węża"
        : "Błąd weryfikacji profilu węża",
    });
  }

  if (!existingProfile || existingProfile.user_id !== req.user.id) {
    return res.status(403).json({
      error: "Brak dostępu do profilu węża",
    });
  }

  const { data, error } = await snakeProfilesRepository.updateProfile(
    req.params.id,
    profile,
    req.supabase,
  );

  if (error) {
    logger.error("Nie udało się zaktualizować profilu węża", error);
    return res.status(isPermissionError(error) ? 403 : 500).json({
      error: isPermissionError(error)
        ? "Brak uprawnień do aktualizacji profilu węża"
        : "Nie udało się zaktualizować profilu węża",
    });
  }

  return res.json(sanitizeProfile(data));
}

module.exports = {
  createProfile,
  getProfile,
  getProfiles,
  updateProfile,
};
