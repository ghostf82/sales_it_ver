const express = require('express');
const router = express.Router();
const {
  getRepresentativeReport,
  getFullReport
} = require('../controllers/reportsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CommissionCalculation:
 *       type: object
 *       properties:
 *         tier1:
 *           type: number
 *           description: Tier 1 commission amount
 *         tier2:
 *           type: number
 *           description: Tier 2 commission amount
 *         tier3:
 *           type: number
 *           description: Tier 3 commission amount
 *         total:
 *           type: number
 *           description: Total commission amount
 *     
 *     RepresentativeReport:
 *       type: object
 *       properties:
 *         representative_id:
 *           type: string
 *           format: uuid
 *         representative_name:
 *           type: string
 *         period:
 *           type: object
 *           properties:
 *             year:
 *               type: integer
 *             month:
 *               type: integer
 *         summary:
 *           type: object
 *           properties:
 *             total_sales:
 *               type: number
 *             total_target:
 *               type: number
 *             total_collection:
 *               type: number
 *             total_commission:
 *               type: number
 *             achievement_percentage:
 *               type: number
 *         sales_details:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/Sale'
 *               - type: object
 *                 properties:
 *                   commission:
 *                     $ref: '#/components/schemas/CommissionCalculation'
 *         collection_records:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               created_at:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /api/reports/representative/{id}:
 *   get:
 *     summary: Get commission report for specific representative
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Representative ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month
 *     responses:
 *       200:
 *         description: Representative commission report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RepresentativeReport'
 *       404:
 *         description: Representative not found
 */
router.get('/representative/:id', getRepresentativeReport);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get full commission report for all representatives
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month
 *     responses:
 *       200:
 *         description: Full commission report
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
 *                     period:
 *                       type: object
 *                       properties:
 *                         year:
 *                           type: integer
 *                         month:
 *                           type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_sales:
 *                           type: number
 *                         total_target:
 *                           type: number
 *                         total_collection:
 *                           type: number
 *                         total_commission:
 *                           type: number
 *                         achievement_percentage:
 *                           type: number
 *                         representatives_count:
 *                           type: integer
 *                     representatives:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           representative_id:
 *                             type: string
 *                             format: uuid
 *                           representative_name:
 *                             type: string
 *                           totals:
 *                             type: object
 *                             properties:
 *                               sales:
 *                                 type: number
 *                               target:
 *                                 type: number
 *                               collection:
 *                                 type: number
 *                               commission:
 *                                 type: number
 *                               achievement_percentage:
 *                                 type: number
 *                           sales:
 *                             type: array
 *                             items:
 *                               allOf:
 *                                 - $ref: '#/components/schemas/Sale'
 *                                 - type: object
 *                                   properties:
 *                                     commission:
 *                                       $ref: '#/components/schemas/CommissionCalculation'
 *                           collection_records:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 amount:
 *                                   type: number
 *                                 year:
 *                                   type: integer
 *                                 month:
 *                                   type: integer
 *                                 created_at:
 *                                   type: string
 *                                   format: date-time
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
 * /api/reports:
 *   get:
 *     summary: Get full commission report for all representatives
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month
 *     responses:
 *       200:
 *         description: Full commission report
 */
router.get('/', getFullReport);

/**
 * @swagger
 * /api/reports/representative/{id}:
 *   get:
 *     summary: Get commission report for specific representative
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Representative ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month
 *     responses:
 *       200:
 *         description: Representative commission report
 */
router.get('/representative/:id', getRepresentativeReport);

module.exports = router;