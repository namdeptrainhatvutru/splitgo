const express = require('express');
const TransactionController = require('../controllers/TransactionController');

const router = express.Router();

// Tạo transaction mới
router.post('/create', TransactionController.createTransaction);

// Lấy danh sách transaction của group
router.get('/group/:group_id', TransactionController.getGroupTransactions);

// Lấy danh sách transaction của user
router.get('/user/:user_id', TransactionController.getUserTransactions);

router.put('/update/:id', TransactionController.UpdateSpilt);

router.get('/:id', TransactionController.getTransactionById);

router.delete('/delete/:id', TransactionController.deleteTransaction);

module.exports = router;
