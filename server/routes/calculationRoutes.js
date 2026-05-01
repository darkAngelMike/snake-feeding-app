const express = require("express");
const calculationController = require("../controllers/calculationController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();
/**
 * @swagger
 * /calculate:
 *   post:
 *     tags: [Calculation]
 *     summary: Calculate feeding recommendation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - life_stage
 *             allOf:
 *               - anyOf:
 *                   - required: [weight_g]
 *                   - required: [current_weight_g]
 *               - anyOf:
 *                   - required: [last_successful_feeding_date]
 *                   - required: [feeding_date]
 *               - anyOf:
 *                   - required: [body_condition]
 *                   - required: [bodyCondition]
 *             properties:
 *               snake_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional snake profile id. When provided, ownership is verified and the calculation is saved.
 *               last_successful_feeding_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-05"
 *               feeding_date:
 *                 type: string
 *                 format: date
 *                 description: Accepted alias for last_successful_feeding_date.
 *                 example: "2026-04-05"
 *               weight_g:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1300
 *               current_weight_g:
 *                 type: integer
 *                 minimum: 1
 *                 description: Accepted alias for weight_g.
 *                 example: 1300
 *               life_stage:
 *                 type: string
 *                 enum: [hatchling, juvenile, subadult, adult]
 *                 example: adult
 *               body_condition:
 *                 type: string
 *                 enum: [underweight, normal, overweight]
 *                 example: normal
 *               bodyCondition:
 *                 type: string
 *                 enum: [underweight, normal, overweight]
 *                 description: Accepted alias for body_condition.
 *                 example: normal
 *               refused_meals_count:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 example: 0
 *               refusedMealsCount:
 *                 type: integer
 *                 minimum: 0
 *                 description: Accepted alias for refused_meals_count.
 *                 example: 0
 *               is_shedding:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *               isShedding:
 *                 type: boolean
 *                 description: Accepted alias for is_shedding.
 *                 example: false
 *               last_meal_weight_g:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *                 example: 110
 *     responses:
 *       200:
 *         description: Feeding plan calculated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 input:
 *                   type: object
 *                 result:
 *                   type: object
 *                   properties:
 *                     mealWeightMin:
 *                       type: integer
 *                     mealWeightMax:
 *                       type: integer
 *                     mealWeightTarget:
 *                       type: integer
 *                     feedingIntervalDays:
 *                       type: integer
 *                     nextFeedingDate:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *                       enum: [ok, due_soon, overdue, vet_check_recommended]
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *                     disclaimer:
 *                       type: string
 *                     daysLeft:
 *                       type: integer
 *                     daysOverdue:
 *                       type: integer
 *                 calculationSaved:
 *                   type: boolean
 *       400:
 *         description: Invalid calculation input.
 *       401:
 *         description: Missing or invalid bearer token.
 *       403:
 *         description: Snake profile does not belong to the authenticated user or RLS denied access.
 */
router.post("/calculate", requireAuth, calculationController.calculate);

module.exports = router;
