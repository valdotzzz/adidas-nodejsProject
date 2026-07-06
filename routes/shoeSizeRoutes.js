const express = require('express');
const router = express.Router();
const c = require('../controllers/variantController');

// Mounted at /api/shoe-sizes — read-only, data is seeded
router.get('/', c.getAllSizes);