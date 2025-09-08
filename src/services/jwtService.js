const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const genneralAccessToken = (payload) => {
    const access_token = jwt.sign({ ...payload }, process.env.ACCESS_TOKEN, { expiresIn: '15m' })
    return access_token
}

const genneralRefreshToken = (payload) => {
    const refresh_token = jwt.sign({ ...payload }, process.env.REFRESH_TOKEN, { expiresIn: '30d' })
    return refresh_token
}

const refreshTokenJwtService = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN)
        const access_token = genneralAccessToken({ id: decoded.id })
        
        return {
            status: "Ok",
            message: "Thành công",
            access_token
        }
        
    } catch (e) {
        console.error(e)
        return {
            status: "Err",
            message: "Lỗi xác thực"
        }
    }
}

module.exports = {
    genneralAccessToken,
    genneralRefreshToken,
    refreshTokenJwtService
}   