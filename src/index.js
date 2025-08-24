require('dotenv').config();
require('./models/User');
require('./models/Group');
require('./models/Member');
require('./models/Transaction');
const express = require('express');
const app = express();
const routers = require('./routers')
const sequelize = require('./config/sequelize')
const PORT = process.env.PORT || 3000;
app.use(express.json());

routers(app)



app.get('/', (req, res) => {
	res.send('Hello World!');
});



sequelize.authenticate().then(() => {
    console.log('Connect to MySQL database successfully!');
    // Thêm đoạn này để sync bảng
    sequelize.sync({alter: true})
        .then(() => {
            console.log('Database synced!');
        })
        .catch((err) => {
            console.error('Database sync error:', err);
        });
}).catch((err) => {
    console.log('Error connecting to MySQL database:', err);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

