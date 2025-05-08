const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');

router.post('/cart', CartController.addToCart);

module.exports = router;
