const { DataTypes } = require('sequelize')
const sequelize = require('../config/sequelize')

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    types: {
        type: DataTypes.ENUM('expense', 'income'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    group_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    by: {
            type: DataTypes.INTEGER,
            allowNull: false,
    },
    date :{
        type : DataTypes.STRING,
        allowNull: true
        },
    split: {
            type: DataTypes.JSON,
            allowNull: true 
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Transactions',
    timestamps: true,
})

module.exports = Transaction