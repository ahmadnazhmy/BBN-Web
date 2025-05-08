const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notificationController')
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/notification', authenticate, notificationController.getNotifications)
router.post('/notification/:id/read', authenticate, notificationController.markNotificationAsRead)
router.delete('/notification', authenticate, notificationController.deleteNotification);

module.exports = router;
