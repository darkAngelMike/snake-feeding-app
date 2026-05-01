const express = require("express");
const snakeProfileController = require("../controllers/snakeProfileController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /snake-profiles:
 *   get:
 *     tags: [Snake Profiles]
 *     summary: List snake profiles for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Snake profiles returned.
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
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       current_weight_g:
 *                         type: integer
 *                       life_stage:
 *                         type: string
 *                         enum: [hatchling, juvenile, subadult, adult]
 *                       body_condition:
 *                         type: string
 *                         enum: [underweight, normal, overweight]
 *                       last_successful_feeding_date:
 *                         type: string
 *                         format: date
 *                         nullable: true
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: RLS denied access to snake profiles.
 */
router.get("/snake-profiles", requireAuth, snakeProfileController.getProfiles);

/**
 * @swagger
 * /snake-profiles/{id}:
 *   get:
 *     tags: [Snake Profiles]
 *     summary: Get one snake profile by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Snake profile id.
 *     responses:
 *       200:
 *         description: Snake profile returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     current_weight_g:
 *                       type: integer
 *                     life_stage:
 *                       type: string
 *                       enum: [hatchling, juvenile, subadult, adult]
 *                     body_condition:
 *                       type: string
 *                       enum: [underweight, normal, overweight]
 *                     last_successful_feeding_date:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: Snake profile does not belong to the authenticated user or RLS denied access.
 */
router.get("/snake-profiles/:id", requireAuth, snakeProfileController.getProfile);

/**
 * @swagger
 * /snake-profiles:
 *   post:
 *     tags: [Snake Profiles]
 *     summary: Create a snake profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - current_weight_g
 *               - life_stage
 *               - body_condition
 *             properties:
 *               name:
 *                 type: string
 *                 example: "QA Python"
 *               current_weight_g:
 *                 type: integer
 *                 minimum: 50
 *                 maximum: 5000
 *                 example: 1000
 *               life_stage:
 *                 type: string
 *                 enum: [hatchling, juvenile, subadult, adult]
 *                 example: adult
 *               body_condition:
 *                 type: string
 *                 enum: [underweight, normal, overweight]
 *                 example: normal
 *               last_successful_feeding_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2026-04-05"
 *     responses:
 *       201:
 *         description: Snake profile created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid snake profile payload.
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: RLS denied creating the snake profile.
 */
router.post("/snake-profiles", requireAuth, snakeProfileController.createProfile);

/**
 * @swagger
 * /snake-profiles/{id}:
 *   patch:
 *     tags: [Snake Profiles]
 *     summary: Update a snake profile
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Snake profile id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               current_weight_g:
 *                 type: integer
 *                 minimum: 50
 *                 maximum: 5000
 *               life_stage:
 *                 type: string
 *                 enum: [hatchling, juvenile, subadult, adult]
 *               body_condition:
 *                 type: string
 *                 enum: [underweight, normal, overweight]
 *               last_successful_feeding_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Snake profile updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid snake profile payload.
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: Snake profile does not belong to the authenticated user or RLS denied access.
 */
router.patch(
  "/snake-profiles/:id",
  requireAuth,
  snakeProfileController.updateProfile,
);

module.exports = router;
