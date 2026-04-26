const {
  createSupabaseClientForToken,
  getSupabaseClient,
} = require("../config/supabaseClient");
const logger = require("../utils/logger");

function getBearerToken(req) {
  const header = req.headers.authorization;

  if (!header || typeof header !== "string") {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      logger.error("Brak tokena autoryzacji");
      return res.status(401).json({
        error: "Wymagane uwierzytelnienie",
      });
    }

    const { data, error } = await getSupabaseClient().auth.getUser(token);

    if (error || !data?.user?.id) {
      logger.error("Niepoprawny token autoryzacji", error);
      return res.status(401).json({
        error: "Niepoprawny token autoryzacji",
      });
    }

    req.user = {
      id: data.user.id,
    };
    req.supabase = createSupabaseClientForToken(token);

    return next();
  } catch (error) {
    logger.error("Błąd middleware autoryzacji", error);
    return res.status(500).json({
      error: "Błąd autoryzacji",
    });
  }
}

module.exports = {
  requireAuth,
};
