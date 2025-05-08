const express = require('express');
const router = express.Router();
const { checkout, getOrderDetail, getAllOrders, updateOrderStatus, cancelPayment, confirmDelivery } = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');

router.post('/checkout', authenticate, checkout);
router.get('/order/:id', authenticate, getOrderDetail);
router.post('/order/:id/cancel-payment', authenticate, cancelPayment);
router.post('/order/:id/confirm-delivery', authenticate, confirmDelivery);
router.get('/admin/orders', getAllOrders); 
router.put('/admin/orders/:id/status', updateOrderStatus);

module.exports = router;
