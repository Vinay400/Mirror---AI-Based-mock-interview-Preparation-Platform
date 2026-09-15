import jwt from 'jsonwebtoken';

const generateToken = (user, remember = false) => {
    const payload = {
        userId: user._id,
        role: user.role || 'user',
        email: user.email
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: remember ? '30d' : '1h' }
    );
};

export default generateToken;
