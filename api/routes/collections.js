const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection
} = require('../controllers/collectionsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Collection:
 *       type: object
 *       required:
 *         - representative_id
 *         - company_id
 *         - year
 *         - month
 *         - amount
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the collection record
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
 *         year:
 *           type: integer
 *           description: Year of the collection
 *           minimum: 2020
 *           maximum: 2030
 *         month:
 *           type: integer
 *           description: Month of the collection
 *           minimum: 1
 *           maximum: 12
 *         amount:
 *           type: number
 *           description: Collection amount
 *           minimum: 0
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
 * /api/collections:
 *   get:
 *     summary: Get all collection records
 *     tags: [Collections]
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
 *     responses:
 *       200:
 *         description: List of collection records
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
 *                     $ref: '#/components/schemas/Collection'
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
router.get('/', getAllCollections);

/**
 * @swagger
 * /api/collections/{id}:
 *   get:
 *     summary: Get collection record by ID
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Collection record ID
 *     responses:
 *       200:
 *         description: Collection record details
 *       404:
 *         description: Collection record not found
 */
router.get('/:id', getCollectionById);

/**
 * @swagger
 * /api/collections:
 *   post:
 *     summary: Create new collection record
 *     tags: [Collections]
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
 *               - year
 *               - month
 *               - amount
 *             properties:
 *               representative_id:
 *                 type: string
 *                 format: uuid
 *               company_id:
 *                 type: string
 *                 format: uuid
 *               year:
 *                 type: integer
 *                 minimum: 2020
 *                 maximum: 2030
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               amount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Collection record created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(schemas.collection), createCollection);

/**
 * @swagger
 * /api/collections/{id}:
 *   put:
 *     summary: Update collection record
 *     tags: [Collections]
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
 *               year:
 *                 type: integer
 *                 minimum: 2020
 *                 maximum: 2030
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               amount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Collection record updated successfully
 *       404:
 *         description: Collection record not found
 */
router.put('/:id', validate(schemas.collection), updateCollection);

/**
 * @swagger
 * /api/collections/{id}:
 *   delete:
 *     summary: Delete collection record
 *     tags: [Collections]
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
 *         description: Collection record deleted successfully
 *       404:
 *         description: Collection record not found
 */
router.delete('/:id', deleteCollection);

module.exports = router;