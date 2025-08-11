const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale
} = require('../controllers/salesController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       required:
 *         - representative_id
 *         - company_id
 *         - category
 *         - sales
 *         - target
 *         - year
 *         - month
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the sale
 *         representative_id:
 *           type: string
 *           format: uuid
 *           description: ID of the representative
 *         representative_name:
 *           type: string
 *           description: Name of the representative
 *         company_id:
 *           type: string
 *           format: uuid
 *           description: ID of the company
 *         company_name:
 *           type: string
 *           description: Name of the company
 *         category:
 *           type: string
 *           description: Product category
 *         sales:
 *           type: number
 *           description: Sales amount
 *           minimum: 0
 *         target:
 *           type: number
 *           description: Target amount
 *           minimum: 0
 *         achievement_percentage:
 *           type: number
 *           description: Achievement percentage (sales/target * 100)
 *         year:
 *           type: integer
 *           description: Year of the sale
 *           minimum: 2020
 *           maximum: 2030
 *         month:
 *           type: integer
 *           description: Month of the sale
 *           minimum: 1
 *           maximum: 12
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 */

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales data
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
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
 *       - in: query
 *         name: representative_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by representative ID
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *     responses:
 *       200:
 *         description: List of sales data
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
 *                     $ref: '#/components/schemas/Sale'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     has_more:
 *                       type: boolean
 */
router.get('/', getAllSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       404:
 *         description: Sale not found
 */
router.get('/:id', getSaleById);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create new sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - representative_id
 *               - company_id
 *               - category
 *               - sales
 *               - target
 *               - year
 *               - month
 *             properties:
 *               representative_id:
 *                 type: string
 *                 format: uuid
 *               company_id:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               sales:
 *                 type: number
 *                 minimum: 0
 *               target:
 *                 type: number
 *                 minimum: 0
 *               year:
 *                 type: integer
 *                 minimum: 2020
 *                 maximum: 2030
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *     responses:
 *       201:
 *         description: Sale created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(schemas.sale), createSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: Update sale
 *     tags: [Sales]
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
 *             type: object
 *             properties:
 *               representative_id:
 *                 type: string
 *                 format: uuid
 *               company_id:
 *                 type: string
 *                 format: uuid
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               sales:
 *                 type: number
 *                 minimum: 0
 *               target:
 *                 type: number
 *                 minimum: 0
 *               year:
 *                 type: integer
 *                 minimum: 2020
 *                 maximum: 2030
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *     responses:
 *       200:
 *         description: Sale updated successfully
 *       404:
 *         description: Sale not found
 */
router.put('/:id', validate(schemas.sale), updateSale);

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Delete sale
 *     tags: [Sales]
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
 *         description: Sale deleted successfully
 *       404:
 *         description: Sale not found
 */
router.delete('/:id', deleteSale);

module.exports = router;