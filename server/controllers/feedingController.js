const feedingsRepository = require("../repositories/feedingsRepository");
const logger = require("../utils/logger");

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

module.exports = {
  getHistory,
};
