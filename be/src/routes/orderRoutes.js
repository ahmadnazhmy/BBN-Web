const express = require('express');
const router = express.Router();
const { checkout, getOrderDetailByPaymentId, getAllOrders, updateOrderStatus, cancelPayment, confirmDelivery, uploadDOFile, updateEstimatedDate } = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');
const uploadDO = require('../middlewares/uploadDOmiddleware'); 

router.post('/checkout', authenticate, checkout);
router.post('/order/:id/cancel-payment', authenticate, cancelPayment);
router.post('/order/:id/confirm-delivery', authenticate, confirmDelivery);
router.post('/orders/:orderId/estimated-date', authenticate, updateEstimatedDate);
router.get('/admin/order/:orderId', authenticate, getOrderDetailByPaymentId);
router.get('/admin/orders', authenticate, getAllOrders);
router.put('/admin/orders/:orderId/status', authenticate, updateOrderStatus);
router.post('/admin/orders/:orderId/upload-do', authenticate, uploadDO.single('doFile'), uploadDOFile);

module.exports = router;