const express = require('express');
const router = express.Router();
const { getOrderPaymentDetailsWithItems, uploadProof, getAllPayments, updatePaymentStatus, updatePaymentMessage, getUnpaidCount, getPaymentByPaymentId, createInvoiceSettlement } = require('../controllers/paymentController');
const auth = require('../middlewares/authMiddleware');
const uploadProofMiddleware = require('../middlewares/uploadProofMiddleware'); 

router.get('/payment/order-details', auth.authenticate, getOrderPaymentDetailsWithItems);
router.post('/upload-proof', auth.authenticate, uploadProofMiddleware.single('proof'), uploadProof);
router.get('/admin/payment', auth.authenticateAdmin, getAllPayments);
router.put('/admin/payment/:id/status', auth.authenticateAdmin, updatePaymentStatus);
router.put('/admin/payment/:id/message', auth.authenticateAdmin, updatePaymentMessage);
router.get('/admin/payment/by-id', auth.authenticateAdmin, getPaymentByPaymentId);
router.get('/payment/by-id', auth.authenticate, getPaymentByPaymentId);
router.get('/unpaid-count', auth.authenticate, getUnpaidCount);
router.post('/admin/payment/invoice-settlement', auth.authenticateAdmin, createInvoiceSettlement);

module.exports = router;
