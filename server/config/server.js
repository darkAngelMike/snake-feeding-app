const DEFAULT_PORT = 3000;

function getPort() {
  return Number(process.env.PORT || DEFAULT_PORT);
}

module.exports = {
  getPort,
};
