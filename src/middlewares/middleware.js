const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.token;
        console.log(authHeader)
        if (!authHeader) {
            return res.status(401).json({ status: "Err", message: "Không có token" });
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;
        console.log(token)
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
            if (err) {
                return res.status(400).json({
                    status: 'Err',
                    message: "Token không hợp lệ hoặc hết hạn"
                })
            }
            req.user = user;
            next()
        })
    } catch (e) {
        console.log(e)
        return res.status(404).json({
            status: "Err",
            message: "Lỗi hệ thống vui lòng thử lại sau!"
        })
    }
}

const roleMiddleware = (allowedRole) => {
    return (req, res, next) => {
        userRole = req.user?.role;

        if (!userRole || !allowedRole.includes(userRole)) {
            return res.status(400).json({
                status: "Err",
                message: "Bạn không có quyền truy cập!"
            })
        }
        next()
    }
}

module.exports = {
    authMiddleware,
    roleMiddleware
}
