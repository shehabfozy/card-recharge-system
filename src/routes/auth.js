const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', auth, authController.me);
router.post('/admin', auth, adminOnly, authController.createAdmin);

module.exports = router;
