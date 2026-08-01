const express = require("express");
const feedingController = require("../controllers/feedingController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /feedings:
 *   get:
 *     tags: [Feedings]
 *     summary: Get feeding history for a snake profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: snake_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Snake profile id owned by the authenticated user.
 *     responses:
 *       200:
 *         description: Feeding history returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         oneOf:
 *                           - type: integer
 *                           - type: string
 *                       snake_id:
 *                         type: string
 *                         format: uuid
 *                       feeding_date:
 *                         type: string
 *                         format: date
 *                       snake_weight_g:
 *                         type: integer
 *                       meal_weight_g:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [success, refused, skipped]
 *                 weightAssessment:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [unknown, weight_loss, rapid_gain, stable, overweight_alert, invalid]
 *                     severity:
 *                       type: string
 *                     changePercent:
 *                       type: number
 *                       nullable: true
 *                     message:
 *                       type: string
 *       400:
 *         description: Missing snake_id query parameter.
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: Snake profile does not belong to the authenticated user or RLS denied access.
 */
router.get("/feedings", requireAuth, feedingController.getFeedings);

/**
 * @swagger
 * /feedings:
 *   post:
 *     tags: [Feedings]
 *     summary: Create a feeding entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - snake_id
 *               - feeding_date
 *               - snake_weight_g
 *               - meal_weight_g
 *             properties:
 *               snake_id:
 *                 type: string
 *                 format: uuid
 *               feeding_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-05"
 *               snake_weight_g:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1300
 *               meal_weight_g:
 *                 type: integer
 *                 minimum: 1
 *                 example: 110
 *               status:
 *                 type: string
 *                 enum: [success, refused, skipped]
 *                 default: success
 *     responses:
 *       201:
 *         description: Feeding entry created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 feeding:
 *                   type: object
 *                   properties:
 *                     id:
 *                       oneOf:
 *                         - type: integer
 *                         - type: string
 *                     snake_id:
 *                       type: string
 *                       format: uuid
 *                     feeding_date:
 *                       type: string
 *                       format: date
 *                     snake_weight_g:
 *                       type: integer
 *                     meal_weight_g:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [success, refused, skipped]
 *                 profileUpdated:
 *                   type: boolean
 *       400:
 *         description: Invalid feeding payload.
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: Snake profile does not belong to the authenticated user or RLS denied access.
 */
router.post("/feedings", requireAuth, feedingController.createFeeding);

/**
 * @swagger
 * /feedings/{id}:
 *   patch:
 *     tags: [Feedings]
 *     summary: Update a feeding entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feeding entry id to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feeding_date:
 *                 type: string
 *                 format: date
 *               snake_weight_g:
 *                 type: integer
 *               meal_weight_g:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [success, refused, skipped]
 *     responses:
 *       200:
 *         description: Feeding entry updated.
 *       400:
 *         description: Invalid feeding payload.
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: Feeding entry does not belong to the authenticated user or RLS denied access.
 */
router.patch("/feedings/:id", requireAuth, feedingController.updateFeeding);

/**
 * @swagger
 * /feedings/{id}:
 *   delete:
 *     tags: [Feedings]
 *     summary: Delete a feeding entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feeding entry id to delete.
 *     responses:
 *       200:
 *         description: Feeding entry deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Wpis karmienia został usunięty"
 *                 data:
 *                   type: object
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: Feeding entry does not belong to the authenticated user or RLS denied access.
 */
router.delete("/feedings/:id", requireAuth, feedingController.deleteFeeding);

module.exports = router;
