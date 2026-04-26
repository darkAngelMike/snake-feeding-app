function isPermissionError(error) {
  if (!error) return false;

  const code = error.code || error.status;
  const message = String(error.message || "").toLowerCase();

  return (
    code === "42501" ||
    code === 401 ||
    code === 403 ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not authorized") ||
    message.includes("unauthorized")
  );
}

module.exports = {
  isPermissionError,
};
