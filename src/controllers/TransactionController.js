const fs = require('fs');
const path = require('path');
const { Transaction, User, Group, Member } = require('../models');
const { Op } = require('sequelize');

class TransactionController {
    async createTransaction(req, res) {
        try {
            const { title, icon, amount, types, group_id, date } = req.body;
            const by = (req.user && req.user.id) || req.body.by;
            let image = null;
            if (req.file) {
                image = '/image/' + req.file.filename;
            }

            // Kiểm tra thiếu by
            if (!by) {
                // Nếu có file vừa upload thì xoá
                if (req.file) {
                    const imagePath = path.join(__dirname, '../../public/image', req.file.filename);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu by (user_id tạo transaction). Tạm thời yêu cầu trong body khi không xác thực'
                });
            }

            // Kiểm tra group có tồn tại
            const group = await Group.findByPk(group_id);
            if (!group) {
                // Nếu có file vừa upload thì xoá
                if (req.file) {
                    const imagePath = path.join(__dirname, '../../public/image', req.file.filename);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
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
                date,
                image
            });

            res.status(201).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            // Nếu có file vừa upload thì xoá
            if (req.file) {
                const imagePath = path.join(__dirname, '../../public/image', req.file.filename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
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
    
    async UpdateSpilt(req, res) {
        try {
            const { id } = req.params;
            const { split } = req.body;

            const transaction = await Transaction.findByPk(id);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction không tồn tại'
                });
            }

            transaction.split = split;
            await transaction.save();

            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getTransactionById(req, res) {
        try {
            const { id } = req.params;

            const transaction = await Transaction.findByPk(id, {
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
                ]
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction không tồn tại'
                });
            }

            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async deleteTransaction(req, res) {
        try {
            const { id } = req.params;

            const transaction = await Transaction.findByPk(id);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction không tồn tại'
                });
           }

            // Xoá file ảnh nếu tồn tại
            if (transaction.image) {
                // Lấy tên file từ đường dẫn /image/filename.png
                const filename = path.basename(transaction.image);
                const imagePath = path.join(__dirname, '../../public/image', filename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await transaction.destroy();

            res.status(200).json({
                success: true,
                message: 'Xóa transaction thành công'
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async addImageToTransaction(req, res) {
        try {
            const { id } = req.params;
            const transaction = await Transaction.findByPk(id);
            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction không tồn tại'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có file ảnh'
                });
            }

            // Nếu đã có ảnh cũ thì xoá
            if (transaction.image) {
                const oldFilename = require('path').basename(transaction.image);
                const oldImagePath = require('path').join(__dirname, '../../public/image', oldFilename);
                if (require('fs').existsSync(oldImagePath)) {
                    require('fs').unlinkSync(oldImagePath);
                }
            }

            transaction.image = '/image/' + req.file.filename;
            await transaction.save();

            res.status(200).json({
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
}

module.exports = new TransactionController();
