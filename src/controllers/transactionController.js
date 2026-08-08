const prisma = require('../config/database');
const { success, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const { agentId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (agentId) where.agentId = parseInt(agentId);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          agent: { select: { name: true } },
          card: { include: { category: true } }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return success(res, { transactions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.getMyTransactions = async (req, res) => {
  try {
    const agentId = req.user.agentId;
    if (!agentId) return error(res, 'غير مصرح', 403);

    const transactions = await prisma.transaction.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      include: { card: { include: { category: true } } }
    });

    return success(res, transactions);
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySales, todayRevenue, monthSales, totalRevenue, topAgents] = await Promise.all([
      prisma.transaction.count({ where: { createdAt: { gte: today } } }),
      prisma.transaction.aggregate({ where: { createdAt: { gte: today } }, _sum: { netAmount: true } }),
      prisma.transaction.count({
        where: { createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } }
      }),
      prisma.transaction.aggregate({ _sum: { netAmount: true } }),
      prisma.transaction.groupBy({
        by: ['agentId'],
        _sum: { netAmount: true },
        _count: { id: true },
        orderBy: { _sum: { netAmount: 'desc' } },
        take: 5
      })
    ]);

    // جلب أسماء الوكلاء
    const agentIds = topAgents.map(a => a.agentId);
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true }
    });
    const agentMap = new Map(agents.map(a => [a.id, a.name]));

    return success(res, {
      todaySales,
      todayRevenue: todayRevenue._sum.netAmount || 0,
      monthSales,
      totalRevenue: totalRevenue._sum.netAmount || 0,
      topAgents: topAgents.map(a => ({
        agentId: a.agentId,
        agentName: agentMap.get(a.agentId) || 'Unknown',
        totalSales: a._count.id,
        totalRevenue: a._sum.netAmount
      }))
    });
  } catch (err) {
    console.error(err);
    return error(res, 'خطأ في الخادم', 500);
  }
};
