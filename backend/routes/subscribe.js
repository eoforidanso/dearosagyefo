const express = require('express');
const router = express.Router();
const subscribeController = require('../controllers/subscribeController');

// POST /api/subscribe — Subscribe with an email address
router.post('/', subscribeController.subscribe);

module.exports = router;
