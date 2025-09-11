const { Group, Member, User } = require('../models');
const { Op } = require('sequelize');

class GroupController {
    async createGroup(req, res) {
        try {
            const { title, icon, currency } = req.body;
            const user_id = (req.user && req.user.id) || req.body.user_id;

            if (!user_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu user_id (tạm thời yêu cầu trong body khi không xác thực)'
                });
            }

            const group = await Group.create({
                title,
                icon,
                currency,
                user_id
            });

            // Tự động thêm user tạo group vào member
            await Member.create({
                user_id,
                group_id: group.id
            });

            res.status(201).json({
                success: true,
                data: group
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async addMember(req, res) {
        try {
            const { user_id, group_id } = req.body;

            // Kiểm tra user và group có tồn tại
            const user = await User.findByPk(user_id);
            const group = await Group.findByPk(group_id);

            if (!user || !group) {
                return res.status(404).json({
                    success: false,
                    message: 'User hoặc Group không tồn tại'
                });
            }

            // Kiểm tra user đã là member chưa
            const existingMember = await Member.findOne({
                where: { user_id, group_id }
            });

            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'User đã là member của group này'
                });
            }

            const member = await Member.create({
                user_id,
                group_id
            });

            res.status(201).json({
                success: true,
                data: member
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getGroupMembers(req, res) {
        try {
            const { group_id } = req.params;

            const members = await Member.findAll({
                where: { group_id },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            res.json({
                success: true,
                data: members
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getUserGroups(req, res) {
        try {
            const user_id = req.params.user_id;

            // Bước 1: Tìm tất cả group_ids mà user tham gia
            const userMemberships = await Member.findAll({
                where: { user_id },
                attributes: ['group_id']
            });

            const groupIds = userMemberships.map(membership => membership.group_id);

            // Bước 2: Tìm groups mà user sở hữu
            const ownedGroups = await Group.findAll({
                where: { user_id },
                attributes: ['id']
            });

            const ownedGroupIds = ownedGroups.map(group => group.id);

            // Bước 3: Gộp tất cả group IDs
            const allGroupIds = [...new Set([...groupIds, ...ownedGroupIds])];

            if (allGroupIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'User không có group nào'
                });
            }

            // Bước 4: Lấy tất cả groups với tất cả members
            const groups = await Group.findAll({
                where: {
                    id: {
                        [Op.in]: allGroupIds
                    }
                },
                include: [
                    {
                        model: Member,
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'email']
                            }
                        ]
                    }
                ]
            });

            res.status(200).json({
                success: true,
                data: groups
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async deleteGroup(req, res) {
        try {
            const { group_id } = req.params;

            // Kiểm tra group có tồn tại không
            const group = await Group.findOne({
                where: { id: group_id }
            });

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Group không tồn tại'
                });
            }

            // Xóa tất cả transactions liên quan đến group và ảnh
            const { Transaction } = require('../models');
            const fs = require('fs');
            const path = require('path');

            const transactions = await Transaction.findAll({
                where: { group_id: group_id }
            });

            for (const transaction of transactions) {
                if (transaction.image) {
                    const filename = path.basename(transaction.image);
                    const imagePath = path.join(__dirname, '../../public/image', filename);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
            }

            await Transaction.destroy({
                where: { group_id: group_id }
            });

            // Xóa tất cả members của group trước
            await Member.destroy({
                where: { group_id: group_id }
            });

            // Sau đó xóa group
            await Group.destroy({
                where: { id: group_id }
            });

            return res.json({
                success: true,
                message: 'Đã xóa group thành công'
            });

        } catch (error) {
            console.error('Delete group error:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getGroupImages(req, res) {
        try {
            const { group_id } = req.params;

            // Kiểm tra group có tồn tại không
            const group = await Group.findByPk(group_id);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Group không tồn tại'
                });
            }

            const { Transaction } = require('../models');
            
            // Lấy tất cả transactions của group có ảnh
            const transactions = await Transaction.findAll({
                where: {
                    group_id: group_id,
                    image: {
                        [Op.ne]: null  // Chỉ lấy các transaction có ảnh
                    }
                },
                attributes: ['id', 'title', 'image', 'amount']
            });

            // Tạo danh sách ảnh
            const images = transactions.map(transaction => ({
                transaction_id: transaction.id,
                title: transaction.title,
                image_url: transaction.image,
                amount: transaction.amount
            }));

            res.json({
                success: true,
                data: {
                    group_id: group_id,
                    group_title: group.title,
                    total_images: images.length,
                    images: images
                }
            });

        } catch (error) {
            console.error('Get group images error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new GroupController();
