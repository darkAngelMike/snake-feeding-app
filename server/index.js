const express = require("express");
const cors = require("cors");
const calculationRoutes = require("./routes/calculationRoutes");
const feedingRoutes = require("./routes/feedingRoutes");
const snakeProfileRoutes = require("./routes/snakeProfileRoutes");
const { getPort } = require("./config/server");
const { errorHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const port = getPort();

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Snake app działa 🐍");
});

app.use(calculationRoutes);
app.use(feedingRoutes);
app.use(snakeProfileRoutes);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server działa na porcie ${port}`);
});
