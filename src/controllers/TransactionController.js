const { Transaction, User, Group, Member } = require('../models');
const { Op } = require('sequelize');

class TransactionController {
    async createTransaction(req, res) {
        try {
            const { title, icon, amount, types, group_id, date } = req.body;
            const by = (req.user && req.user.id) || req.body.by;

            if (!by) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu by (user_id tạo transaction). Tạm thời yêu cầu trong body khi không xác thực'
                });
            }

            // Kiểm tra group có tồn tại
            const group = await Group.findByPk(group_id);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Group không tồn tại'
                });
            }

            const transaction = await Transaction.create({
                title,
                icon,
                amount,
                types,
                group_id,
                by,
                date
            });

            res.status(201).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getGroupTransactions(req, res) {
        try {
            const { group_id } = req.params;

            const transactions = await Transaction.findAll({
                where: { group_id },
                include: [{
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name']
                }],
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getUserTransactions(req, res) {
        try {
            const { user_id } = req.params;

            const transactions = await Transaction.findAll({
                where: {
                    [Op.or]: [
                        { by: user_id }, // Transactions user tạo
                        { '$Group.Members.user_id$': user_id } // Transactions trong groups mà user là thành viên
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name']
                    },
                    {
                        model: Group,
                        include: [{
                            model: Member,
                            include: [{
                                model: User,
                                attributes: ['id', 'name']
                            }]
                        }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new TransactionController();
