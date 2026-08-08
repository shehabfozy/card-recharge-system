const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { success, error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'يرجى إدخال اسم المستخدم وكلمة المرور');

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return error(res, 'بيانات الدخول غير صحيحة', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 'بيانات الدخول غير صحيحة', 401);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    await prisma.log.create({
      data: { action: 'LOGIN', details: `تسجيل دخول: ${username}`, userId: user.id }
    });

    return success(res, { token, user: { id: user.id, username: user.username, role: user.role } }, 'تم تسجيل الدخول بنجاح');
  } catch (err) {
    console.error(err);
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, role: true, createdAt: true }
    });
    return success(res, user);
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashed, role: 'admin' }
    });
    return success(res, { id: user.id, username: user.username }, 'تم إنشاء المدير بنجاح', 201);
  } catch (err) {
    return error(res, 'اسم المستخدم موجود مسبقاً');
  }
};
