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

            // Tìm tất cả groups mà user tham gia
            const groups = await Group.findAll({
                include: [
                    {
                        model: Member,
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'email']  // Chỉ lấy các trường cần thiết của User
                            }
                        ]
                    }
                ],
                where: {
                    [Op.or]: [
                        { user_id: user_id },  // Groups user sở hữu
                        { '$Members.user_id$': user_id }  // Groups user là thành viên
                    ]
                }
            });

            if (!groups || groups.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'User không có group nào'
                });
            }

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
}

module.exports = new GroupController();
