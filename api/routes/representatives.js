const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const {
  getAllRepresentatives,
  getRepresentativeById,
  createRepresentative,
  updateRepresentative,
  deleteRepresentative
} = require('../controllers/representativesController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Representative:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the representative
 *         name:
 *           type: string
 *           description: Representative's full name
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           description: Representative's email address
 *         phone:
 *           type: string
 *           description: Representative's phone number
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 */

/**
 * @swagger
 * /api/representatives:
 *   get:
 *     summary: Get all representatives
 *     tags: [Representatives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of representatives
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
 *                     $ref: '#/components/schemas/Representative'
 *       401:
 *         description: Unauthorized
 */
router.get('/', getAllRepresentatives);

/**
 * @swagger
 * /api/representatives/{id}:
 *   get:
 *     summary: Get representative by ID
 *     tags: [Representatives]
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
 *     responses:
 *       200:
 *         description: Representative details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representative'
 *       404:
 *         description: Representative not found
 */
router.get('/:id', getRepresentativeById);

/**
 * @swagger
 * /api/representatives:
 *   post:
 *     summary: Create new representative
 *     tags: [Representatives]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Representative created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(schemas.representative), createRepresentative);

/**
 * @swagger
 * /api/representatives/{id}:
 *   put:
 *     summary: Update representative
 *     tags: [Representatives]
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
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Representative updated successfully
 *       404:
 *         description: Representative not found
 */
router.put('/:id', validate(schemas.representative), updateRepresentative);

/**
 * @swagger
 * /api/representatives/{id}:
 *   delete:
 *     summary: Delete representative
 *     tags: [Representatives]
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
 *         description: Representative deleted successfully
 *       404:
 *         description: Representative not found
 */
router.delete('/:id', deleteRepresentative);

module.exports = router;