const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Snake Feeding API",
      version: "1.0.0",
      description: "API for snake feeding tracking and recommendations",
    },
    servers: [
      { url: "http://localhost:3000", description: "Środowisko Lokalne" },
      {
        url: "https://snake-backend-qpzk.onrender.com",
        description: "Serwer Produkcyjny (Render)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "../routes/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };