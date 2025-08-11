const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const {
  getAllCommissionRules,
  getCommissionRuleById,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule
} = require('../controllers/commissionRulesController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CommissionRule:
 *       type: object
 *       required:
 *         - category
 *         - tier1_from
 *         - tier1_to
 *         - tier1_rate
 *         - tier2_from
 *         - tier2_to
 *         - tier2_rate
 *         - tier3_from
 *         - tier3_rate
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the commission rule
 *         category:
 *           type: string
 *           description: Product category this rule applies to
 *         tier1_from:
 *           type: number
 *           description: Tier 1 achievement percentage start
 *           minimum: 0
 *           maximum: 100
 *         tier1_to:
 *           type: number
 *           description: Tier 1 achievement percentage end
 *           minimum: 0
 *           maximum: 100
 *         tier1_rate:
 *           type: number
 *           description: Tier 1 commission rate (decimal)
 *           minimum: 0
 *           maximum: 1
 *         tier2_from:
 *           type: number
 *           description: Tier 2 achievement percentage start
 *           minimum: 0
 *           maximum: 100
 *         tier2_to:
 *           type: number
 *           description: Tier 2 achievement percentage end
 *           minimum: 0
 *           maximum: 100
 *         tier2_rate:
 *           type: number
 *           description: Tier 2 commission rate (decimal)
 *           minimum: 0
 *           maximum: 1
 *         tier3_from:
 *           type: number
 *           description: Tier 3 achievement percentage start
 *           minimum: 0
 *           maximum: 100
 *         tier3_rate:
 *           type: number
 *           description: Tier 3 commission rate (decimal)
 *           minimum: 0
 *           maximum: 1
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/commission-rules:
 *   get:
 *     summary: Get all commission rules
 *     tags: [Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of commission rules
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
 *                     $ref: '#/components/schemas/CommissionRule'
 */
router.get('/', getAllCommissionRules);

/**
 * @swagger
 * /api/commission-rules/{id}:
 *   get:
 *     summary: Get commission rule by ID
 *     tags: [Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Commission rule ID
 *     responses:
 *       200:
 *         description: Commission rule details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CommissionRule'
 *       404:
 *         description: Commission rule not found
 */
router.get('/:id', getCommissionRuleById);

/**
 * @swagger
 * /api/commission-rules:
 *   post:
 *     summary: Create new commission rule
 *     tags: [Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - tier1_from
 *               - tier1_to
 *               - tier1_rate
 *               - tier2_from
 *               - tier2_to
 *               - tier2_rate
 *               - tier3_from
 *               - tier3_rate
 *             properties:
 *               category:
 *                 type: string
 *                 example: "اسمنتي"
 *               tier1_from:
 *                 type: number
 *                 example: 50
 *               tier1_to:
 *                 type: number
 *                 example: 70
 *               tier1_rate:
 *                 type: number
 *                 example: 0.0025
 *               tier2_from:
 *                 type: number
 *                 example: 71
 *               tier2_to:
 *                 type: number
 *                 example: 100
 *               tier2_rate:
 *                 type: number
 *                 example: 0.003
 *               tier3_from:
 *                 type: number
 *                 example: 101
 *               tier3_rate:
 *                 type: number
 *                 example: 0.004
 *     responses:
 *       201:
 *         description: Commission rule created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(schemas.commissionRule), createCommissionRule);

/**
 * @swagger
 * /api/commission-rules/{id}:
 *   put:
 *     summary: Update commission rule
 *     tags: [Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommissionRule'
 *     responses:
 *       200:
 *         description: Commission rule updated successfully
 *       404:
 *         description: Commission rule not found
 */
router.put('/:id', validate(schemas.commissionRule), updateCommissionRule);

/**
 * @swagger
 * /api/commission-rules/{id}:
 *   delete:
 *     summary: Delete commission rule
 *     tags: [Commission Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Commission rule deleted successfully
 *       404:
 *         description: Commission rule not found
 */
router.delete('/:id', deleteCommissionRule);

module.exports = router;