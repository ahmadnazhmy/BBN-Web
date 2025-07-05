const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController'); 

router.get('/profile', authenticate, profileController.getProfile);
router.put('/profile', authenticate, profileController.updateProfile);
router.get('/users/:id', profileController.getUserById);
router.get('/user', profileController.getAllUsers);
router.get('/user/:id/purchase-history', authenticate, profileController.getUserPurchaseHistory);
router.post('/user/:id/add-reward', authenticate, profileController.addRewardToUser);

module.exports = router;
