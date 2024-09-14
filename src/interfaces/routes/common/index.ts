import express from 'express';
import { fetchCountryCodes } from '../../controllers/CountryCodeController';
import { getCategories } from '../../controllers/getCategories.controller';

const commonRouter = express.Router();

/**
 * @openapi
 * /countries/codes:
 *   get:
 *     summary: Get country codes
 *     description: Fetches a list of country codes with corresponding country names.
 *     tags:
 *       - Common
 *     responses:
 *       200:
 *         description: A list of country codes and their corresponding country names
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                     description: The country code.
 *                   country:
 *                     type: string
 *                     description: The name of the country.
 *                 example:
 *                   - code: '+1'
 *                     country: 'United States'
 *                   - code: '+91'
 *                     country: 'India'
 */
commonRouter.get('/countries/codes', fetchCountryCodes);

// Route to get all categories
commonRouter.get('/categories', getCategories);

export default commonRouter;
