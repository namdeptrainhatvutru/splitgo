const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const client = new OAuth2Client()
const jwtService = require('../services/jwtService')

const register = async (req, res) => {

    try {
        const { name, password, email } = req.body;
        // check name tồn tại
        if (!name || !password || !email) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
        }
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({status : "err", error: 'Email này đã được đăng ký' });
        }
        const existingNameUser = await User.findOne({ where: { name } });
        if (existingNameUser) {
            return res.status(400).json({ status : "err",error: 'Tên này đã được sử dụng, vui lòng chọn tên khác' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }
        // Mã hóa mật khẩu
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
        console.log('Google login request received:', req.body);
        const { idToken } = req.body;
        
        let email, name, picture;
        
        // Nếu có idToken thì verify, nếu không thì dùng thông tin trực tiếp
        if (idToken) {
            try {
                const allowedAudiences = [
                    process.env.GOOGLE_CLIENT_ID_WEB,
                    process.env.GOOGLE_CLIENT_ID_IOS,
                    process.env.GOOGLE_CLIENT_ID_ANDROID,
                    '565388207932-04uun7gbfaok62jbvdj8n349u5jv162f.apps.googleusercontent.com', // Thêm client ID của bạn
                ].filter(Boolean);
                
                console.log('Verifying token with audiences:', allowedAudiences);
                
                const ticket = await client.verifyIdToken({
                    idToken,
                    audience: allowedAudiences,
                });
                
                const payload = ticket.getPayload();
                console.log('Token verified, payload:', payload);
                
                email = payload.email;
                name = payload.name;
                picture = payload.picture;
            } catch (verifyError) {
                console.error('Token verification failed:', verifyError);
                
                // Nếu verify token thất bại nhưng đã có thông tin từ client, dùng thông tin đó
                if (emailFromClient) {
                    console.log('Using client-provided info instead');
                    email = emailFromClient;
                    name = nameFromClient;
                    picture = pictureFromClient;
                } else {
                    throw verifyError;
                }
            }
        } else if (emailFromClient) {
            // Nếu không có idToken nhưng có email từ client
            email = emailFromClient;
            name = nameFromClient;
            picture = pictureFromClient;
        } else {
            throw new Error('Không có thông tin đăng nhập');
        }
        
        console.log('Finding or creating user with email:', email);
        
        let user = await User.findOne({ where: { email } });
        if (!user) {
            console.log('Creating new user');
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                password: 'google-oauth',
                type: 'loginWithGoogle',
                avatar: picture
            });
        } else if (user.type === 'login') {
            console.log('User already exists with password login');
            return res.status(400).json({ 
                status: 'ERR',
                message: 'Email này đã được đăng ký bằng mật khẩu' 
            });
        }

        // Tạo token - BỎ COMMENT DÒNG NÀY
        const access_token = jwtService.genneralAccessToken({ id: user.id, role: user.role });
        const refresh_token = jwtService.genneralRefreshToken({ id: user.id, role: user.role });

        console.log('Login successful, returning tokens');
        
        return res.json({
            status: 'OK', // Sửa từ 'Ok' thành 'OK' để match với frontend
            message: 'Đăng nhập Google thành công',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            access_token,  // Thêm access_token
            refresh_token  // Thêm refresh_token
        });
    } catch (error) {
        console.error('Google login error:', error);
        return res.status(401).json({ 
            status: 'ERR',
            message: error.message 
        });
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
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({
            status: "Err",
            message: "Token không được để trống"
        });
    }
    const result = jwtService.refreshTokenJwtService(refreshToken);
    if (result.status === "Err") {
        return res.status(401).json(result);
    }
    return res.json(result);
}
const updateName = async (req, res) => {
    try {
        const { id } = req.params; // Giả sử bạn đã xác thực và có user id trong req.user
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Tên mới không được để trống' });
        }

        // Kiểm tra tên đã tồn tại chưa
        const existingNameUser = await User.findOne({ where: { name } });
        if (existingNameUser) {
            return res.status(400).json({ error: 'Tên này đã được sử dụng, vui lòng chọn tên khác' });
        }

        // Cập nhật tên
        await User.update({ name }, { where: { id } });

        return res.json({
            status: 'OK',
            message: 'Cập nhật tên thành công',
            name
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    googleLogin,
    getAllUsers,
    refreshToken,
    updateName // Thêm updateName vào exports
};
