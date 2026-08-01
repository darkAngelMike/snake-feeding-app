const { getSupabaseServiceRoleClient } = require("../config/supabaseClient");
const logger = require("../utils/logger");

const TEST_EMAIL_PREFIXES = ["qa_", "test_"];
const TEST_EMAIL_DOMAIN = "@snake.local";

function getAdminSecret(req) {
  const header = req.headers["x-admin-secret"];
  return Array.isArray(header) ? header[0] : header;
}

function isTestCleanupEnabled() {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.ALLOW_TEST_CLEANUP === "true"
  );
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

function assertTestCleanupEnabled(req, res) {
  if (isTestCleanupEnabled()) {
    return true;
  }

  logger.error("Odrzucono cleanup poza jawnie testowym środowiskiem");
  res.status(403).json({
    error: "Cleanup jest dostępny tylko w środowisku testowym",
  });
  return false;
}

function getCleanupEmailPrefix(req) {
  return String(req.body?.userEmailPrefix || "").trim().toLowerCase();
}

function isAllowedTestEmailPrefix(prefix) {
  return (
    prefix.length >= 3 &&
    TEST_EMAIL_PREFIXES.some((allowedPrefix) => prefix.startsWith(allowedPrefix))
  );
}

function assertTestEmailPrefix(req, res) {
  const prefix = getCleanupEmailPrefix(req);

  if (isAllowedTestEmailPrefix(prefix)) {
    return prefix;
  }

  res.status(400).json({
    error: "Wymagany jest bezpieczny prefix użytkowników testowych",
  });
  return null;
}

function isMatchingTestUser(user, emailPrefix) {
  const email = String(user.email || "").toLowerCase();
  return email.startsWith(emailPrefix) && email.endsWith(TEST_EMAIL_DOMAIN);
}

async function deleteRowsByUserIds(client, tableName, userIds) {
  if (userIds.length === 0) return 0;

  const { count, error } = await client
    .from(tableName)
    .delete({ count: "exact" })
    .in("user_id", userIds);

  if (error) {
    throw error;
  }

  return count ?? "unknown";
}

function filterTestUsers(users, emailPrefix) {
  return users.filter((user) => isMatchingTestUser(user, emailPrefix));
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

async function listTestUsers(client, emailPrefix) {
  const users = await listAllUsers(client);
  return filterTestUsers(users, emailPrefix);
}

async function deleteAuthUsers(client, users) {
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
  if (!assertTestCleanupEnabled(req, res)) return;

  const emailPrefix = assertTestEmailPrefix(req, res);
  if (!emailPrefix) return;

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
    const testUsers = await listTestUsers(client, emailPrefix);
    const userIds = testUsers.map((user) => user.id);
    const deleted = {
      feeding_calculations: await deleteRowsByUserIds(
        client,
        "feeding_calculations",
        userIds,
      ),
      feedings: await deleteRowsByUserIds(client, "feedings", userIds),
      snake_profiles: await deleteRowsByUserIds(
        client,
        "snake_profiles",
        userIds,
      ),
      users: await deleteAuthUsers(client, testUsers),
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
