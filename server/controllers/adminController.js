const { getSupabaseServiceRoleClient } = require("../config/supabaseClient");
const logger = require("../utils/logger");

function getAdminSecret(req) {
  const header = req.headers["x-admin-secret"];
  return Array.isArray(header) ? header[0] : header;
}

function assertAdminSecret(req, res) {
  const expectedSecret = process.env.ADMIN_CLEANUP_SECRET;
  const providedSecret = getAdminSecret(req);

  if (!expectedSecret || providedSecret !== expectedSecret) {
    res.status(403).json({
      error: "Brak dostępu do operacji administracyjnej",
    });
    return false;
  }

  return true;
}

async function deleteTableRows(client, tableName) {
  const { count, error } = await client
    .from(tableName)
    .delete({ count: "exact" })
    .not("id", "is", null);

  if (error) {
    throw error;
  }

  return count ?? "unknown";
}

async function listAllUsers(client) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const pageUsers = data?.users || [];
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      return users;
    }

    page += 1;
  }
}

async function deleteAuthUsers(client) {
  const users = await listAllUsers(client);

  for (const user of users) {
    const { error } = await client.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }
  }

  return users.length;
}

async function cleanup(req, res) {
  if (!assertAdminSecret(req, res)) return;

  let client;

  try {
    client = getSupabaseServiceRoleClient();
  } catch (error) {
    logger.error("Brak konfiguracji service role dla cleanup", error);
    return res.status(500).json({
      error: "Brak konfiguracji SUPABASE_SERVICE_ROLE_KEY w backendzie",
    });
  }

  try {
    const deleted = {
      feeding_calculations: await deleteTableRows(
        client,
        "feeding_calculations",
      ),
      feedings: await deleteTableRows(client, "feedings"),
      snake_profiles: await deleteTableRows(client, "snake_profiles"),
      users: await deleteAuthUsers(client),
    };

    return res.json({
      success: true,
      deleted,
    });
  } catch (error) {
    logger.error("Nie udało się wykonać cleanup danych testowych", error);
    return res.status(500).json({
      error: "Nie udało się wykonać cleanup danych testowych",
    });
  }
}

module.exports = {
  cleanup,
};
