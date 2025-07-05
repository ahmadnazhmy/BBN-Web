const express = require('express');
const router = express.Router();
const { applyReward, getAvailableRewards } = require('../controllers/rewardController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/apply-reward', authenticate, applyReward);
router.get('/user/:userId/rewards', authenticate, getAvailableRewards);

module.exports = router;