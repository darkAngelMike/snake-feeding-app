function error(message, details) {
  if (details) {
    console.error(`[backend] ${message}`, details);
    return;
  }

  console.error(`[backend] ${message}`);
}

function info(message) {
  console.log(`[backend] ${message}`);
}

module.exports = {
  error,
  info,
};
