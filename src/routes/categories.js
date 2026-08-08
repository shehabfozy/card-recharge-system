const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, categoryController.getAll);
router.post('/', auth, adminOnly, categoryController.create);
router.put('/:id', auth, adminOnly, categoryController.update);
router.delete('/:id', auth, adminOnly, categoryController.delete);

module.exports = router;
