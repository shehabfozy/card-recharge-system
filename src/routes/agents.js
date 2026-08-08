const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, agentController.getAll);
router.get('/me', auth, agentController.getMyProfile);
router.get('/:id', auth, adminOnly, agentController.getById);
router.post('/', auth, adminOnly, agentController.create);
router.put('/:id', auth, adminOnly, agentController.update);
router.delete('/:id', auth, adminOnly, agentController.delete);
router.post('/:id/recharge', auth, adminOnly, agentController.recharge);

module.exports = router;
