const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, transactionController.getAll);
router.get('/me', auth, transactionController.getMyTransactions);
router.get('/dashboard', auth, adminOnly, transactionController.getDashboard);

module.exports = router;
