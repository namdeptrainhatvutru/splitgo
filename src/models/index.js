const User = require('./User');
const Group = require('./Group');
const Member = require('./Member');
const Transaction = require('./Transaction');

// User - Group (1:N)
User.hasMany(Group, { foreignKey: 'user_id' });
Group.belongsTo(User, { foreignKey: 'user_id' });

// User - Member (1:N)
User.hasMany(Member, { foreignKey: 'user_id' });
Member.belongsTo(User, { foreignKey: 'user_id' });

// Group - Member (1:N)
Group.hasMany(Member, { foreignKey: 'group_id' });
Member.belongsTo(Group, { foreignKey: 'group_id' });

// User - Group (N:N) qua Member
User.belongsToMany(Group, { through: Member, foreignKey: 'user_id' });
Group.belongsToMany(User, { through: Member, foreignKey: 'group_id' });

// Transaction associations
Transaction.belongsTo(User, { foreignKey: 'by', as: 'creator' });
User.hasMany(Transaction, { foreignKey: 'by' });

Transaction.belongsTo(Group, { foreignKey: 'group_id' });
Group.hasMany(Transaction, { foreignKey: 'group_id' });

module.exports = {
  User,
  Group,
  Member,
  Transaction
};