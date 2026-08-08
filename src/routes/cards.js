const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', auth, cardController.getAll);
router.get('/stats', auth, adminOnly, cardController.getStats);
router.post('/import', auth, adminOnly, cardController.importCards);
router.post('/import-file', auth, adminOnly, upload.single('file'), cardController.importFromFile);
router.post('/sell', auth, cardController.sellCard);

module.exports = router;
