const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const Joi = require('joi');
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/companiesController');

// Company validation schema
const companySchema = Joi.object({
  name: Joi.string().required().min(2).max(100)
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the company
 *         name:
 *           type: string
 *           description: Company name
 *           minLength: 2
 *           maxLength: 100
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 */

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
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
 *                     $ref: '#/components/schemas/Company'
 */
router.get('/', getAllCompanies);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *       404:
 *         description: Company not found
 */
router.get('/:id', getCompanyById);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create new company
 *     tags: [Companies]
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
 *                 example: "شركة المديفر"
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(companySchema), createCompany);

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Update company
 *     tags: [Companies]
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
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       404:
 *         description: Company not found
 */
router.put('/:id', validate(companySchema), updateCompany);

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Delete company
 *     tags: [Companies]
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
 *         description: Company deleted successfully
 *       404:
 *         description: Company not found
 */
router.delete('/:id', deleteCompany);

module.exports = router;