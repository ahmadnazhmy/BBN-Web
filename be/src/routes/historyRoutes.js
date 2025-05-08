const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/user/history', authenticate, historyController.getUserHistory);

module.exports = router;
