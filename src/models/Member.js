const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')

const Member = sequelize.define('Member', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'Members',
    timestamps: true,
})

module.exports = Member