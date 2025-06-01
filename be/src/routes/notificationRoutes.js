const express = require('express')
const router = express.Router()
const { getNotifications, markNotificationAsRead, deleteNotification, getUnreadNotificationCount } = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/notification', authenticate, getNotifications);
router.post('/notification/:id/read', authenticate, markNotificationAsRead);
router.delete('/notification', authenticate, deleteNotification);
router.get('/notification/count', authenticate, getUnreadNotificationCount);

module.exports = router;