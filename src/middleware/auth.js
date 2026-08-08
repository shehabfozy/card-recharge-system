const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return error(res, 'يرجى تسجيل الدخول', 401);

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'التوكن غير صالح', 401);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return error(res, 'غير مصرح لك', 403);
  }
  next();
};

module.exports = { auth, adminOnly };
