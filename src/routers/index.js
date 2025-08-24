const userRouter = require('./UserRouter')
const groupRouter = require('./GroupRouter')
const transactionRouter = require('./TransactionRouter')
const routers = (app) => {
	app.use('/users', userRouter);
	app.use('/groups', groupRouter);
	app.use('/transactions', transactionRouter);
};

module.exports = routers;
