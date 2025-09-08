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
app.use('/image', express.static('public/image'));

routers(app)



app.get('/', (req, res) => {
	res.send('Hello World!');
});



sequelize.authenticate().then(() => {
    console.log('Connect to MySQL database successfully!');
    // Thêm đoạn này để sync bảng
    sequelize.sync() // Sử dụng { force: true } nếu bạn muốn xóa và tạo lại bảng (dữ liệu sẽ mất)
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

