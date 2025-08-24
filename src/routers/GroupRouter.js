const express = require('express');
const GroupController = require('../controllers/GroupController');


const router = express.Router();

// Tạo group mới
router.post('/create', GroupController.createGroup);

// Thêm member vào group
router.post('/add-member', GroupController.addMember);

// Lấy danh sách member của group
router.get('/:group_id/members', GroupController.getGroupMembers);
// Lấy danh sách group của user
router.get('/user/:user_id', GroupController.getUserGroups);
router.delete('/:group_id', GroupController.deleteGroup);
module.exports = router;
