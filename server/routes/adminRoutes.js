const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     xAdminSecret:
 *       type: apiKey
 *       in: header
 *       name: x-admin-secret
 *
 * /admin/cleanup:
 *   post:
 *     tags: [Admin]
 *     summary: Clean up test users and their data
 *     security:
 *       - xAdminSecret: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmailPrefix
 *             properties:
 *               userEmailPrefix:
 *                 type: string
 *                 description: Safe test user email prefix. Must start with qa_ or test_.
 *                 example: "qa_run_123"
 *     responses:
 *       200:
 *         description: Test data cleanup completed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 deleted:
 *                   type: object
 *                   properties:
 *                     feeding_calculations:
 *                       oneOf:
 *                         - type: integer
 *                         - type: string
 *                     feedings:
 *                       oneOf:
 *                         - type: integer
 *                         - type: string
 *                     snake_profiles:
 *                       oneOf:
 *                         - type: integer
 *                         - type: string
 *                     users:
 *                       type: integer
 *       400:
 *         description: Missing or unsafe test user email prefix.
 *       403:
 *         description: Missing or invalid x-admin-secret header, or cleanup is disabled outside a test environment.
 */
router.post("/admin/cleanup", adminController.cleanup);

module.exports = router;
