const express = require('express')
const router = express.Router()
const { uploadProof, getAllPayments, updatePaymentStatus, updatePaymentMessage } = require('../controllers/paymentController')
const auth = require('../middlewares/authMiddleware')
const upload = require('../middlewares/uploadMiddleware')

router.post('/upload-proof', auth.authenticate, upload.single('proof'), uploadProof)
router.get('/admin/payment', getAllPayments)
router.put('/admin/payment/:id/status', updatePaymentStatus)
router.put('/admin/payment/:id/message', updatePaymentMessage);

module.exports = router
