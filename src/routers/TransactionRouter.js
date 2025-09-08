const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/TransactionController');
const upload = require('../middlewares/uploadImage');

// Tạo transaction mới
router.post('/create', upload.single('image'), TransactionController.createTransaction);

// Lấy danh sách transaction của group
router.get('/group/:group_id', TransactionController.getGroupTransactions);

// Lấy danh sách transaction của user
router.get('/user/:user_id', TransactionController.getUserTransactions);

router.put('/update/:id', TransactionController.UpdateSpilt);

router.get('/:id', TransactionController.getTransactionById);

router.delete('/delete/:id', TransactionController.deleteTransaction);

router.put('/:id/image', upload.single('image'), TransactionController.addImageToTransaction);

module.exports = router;
