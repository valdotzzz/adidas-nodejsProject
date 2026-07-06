const express = require('express');
const router = express.Router();
const c = require('../controllers/variantController');

router.get('/', c.getAllSizes);

module.exports = router;