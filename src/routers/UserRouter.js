const express = require('express')
const router = express.Router()
const userController = require('../controllers/UserController')





router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/google-login', userController.googleLogin);
// ...existing code...
router.post('/refresh-token', userController.refreshToken);
router.get('/all', userController.getAllUsers);
router.put('/update-name/:id', userController.updateName);
module.exports = router