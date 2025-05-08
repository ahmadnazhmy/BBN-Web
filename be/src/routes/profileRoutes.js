const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController'); 

router.get('/profile', authenticate, profileController.getProfile);
router.put('/profile', authenticate, profileController.updateProfile);
router.get('/users/:id', profileController.getUserById);
router.get('/user', profileController.getAllUsers);

module.exports = router;
