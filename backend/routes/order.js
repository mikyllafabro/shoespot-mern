const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { updateOrderStatus } = require('../controllers/fetchOrders');

const { placeOrder,
    getUserOrders,
    // deleteOrderedProducts } = require('../controllers/order');
    deleteOrderedProducts
    // updateOrderStatus,

} = require('../controllers/order');

router.post('/place-order', protect, placeOrder);
router.get('/user-orders/:userId', protect, getUserOrders);
router.delete('/delete-ordered-products', protect, deleteOrderedProducts);


module.exports = router;