const prisma = require('../config/database');
const { success, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.log.count()
    ]);
    return success(res, { logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};
