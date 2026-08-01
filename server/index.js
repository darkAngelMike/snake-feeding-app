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

const defaultOrigins = [
  "https://snake-feeding-app.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.json());

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="snake-feeding-api.json"',
  );
  res.send(swaggerSpec);
});

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
