const logger = require("../utils/logger");

function errorHandler(error, _req, res, _next) {
  logger.error("Nieobsłużony błąd requestu", error);

  if (res.headersSent) {
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({
      error: "Niepoprawny JSON w body requestu",
    });
    return;
  }

  res.status(500).json({
    error: "Internal server error",
  });
}

module.exports = {
  errorHandler,
};
