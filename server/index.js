const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./config/openapi");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const adminRoutes = require("./routes/adminRoutes");
const calculationRoutes = require("./routes/calculationRoutes");
const feedingRoutes = require("./routes/feedingRoutes");
const snakeProfileRoutes = require("./routes/snakeProfileRoutes");
const { getPort } = require("./config/server");
const { errorHandler } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const port = getPort();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://*.supabase.co"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);

app.use(
  cors({
    origin: "https://snake-feeding-app.vercel.app",
  }),
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.send("Snake app działa 🐍");
});

app.use(adminRoutes);
app.use(calculationRoutes);
app.use(feedingRoutes);
app.use(snakeProfileRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server działa na porcie ${port}`);
});
