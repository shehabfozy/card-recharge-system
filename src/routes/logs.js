const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, logController.getAll);

module.exports = router;
