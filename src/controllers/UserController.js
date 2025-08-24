const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const client = new OAuth2Client()
const jwtService = require('../services/jwtService')

const register = async (req, res) => {

    try {
        const { name, password, email } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, password: hashedPassword, email });
        res.json({
            status: 'OK',
            message: 'User đăng ký successfully',
            data: user
            });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
      

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const access_token = jwtService.genneralAccessToken({id : user.id, role: user.role});
        const refresh_token = jwtService.genneralRefreshToken({id : user.id, role: user.role});
        res.json({
            status: 'OK',
            message: 'User logged in successfully',
            data: user,
            access_token,
            refresh_token
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const googleLogin = async (req, res) => {
   try {
        const { idToken } = req.body;
        const allowedAudiences = [
            process.env.GOOGLE_CLIENT_ID_WEB,
            process.env.GOOGLE_CLIENT_ID_IOS,
            process.env.GOOGLE_CLIENT_ID_ANDROID,
            process.env.GOOGLE_CLIENT_ID,
        ].filter(Boolean)   
        const ticket = await client.verifyIdToken({
            idToken,
            audience: allowedAudiences,
        })
        const payload = ticket.getPayload()
        const { email, name, picture } = payload
        let user = await User.findOne({ where: { email } });
        if (!user) {
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                password: 'google-oauth',
                type: 'loginWithGoogle',
                avatar: picture
            });
        } else if (user.type === 'login') {
            return res.status(400).json({ error: 'Email này đã được đăng ký bằng mật khẩu' });
        }

        // const access_token = jwtService.genneralAccessToken({ id: user.id, role: user.role });
        // const refresh_token = jwtService.genneralRefreshToken({ id: user.id, role: user.role });

        return res.json({
            status: 'Ok',
            message: 'Đăng nhập Google thành công',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        return res.status(401).json({ error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name','email']  // Chỉ lấy id và name
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    googleLogin,
    getAllUsers  // Thêm getAllUsers vào exports
};
