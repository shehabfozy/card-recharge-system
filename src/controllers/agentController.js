const prisma = require('../config/database');
const { success, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true } }
      }
    });
    return success(res, agents);
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await prisma.agent.findUnique({
      where: { id: parseInt(id) },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } }
    });
    if (!agent) return error(res, 'الوكيل غير موجود', 404);
    return success(res, agent);
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, commission = 10 } = req.body;
    if (!name || !phone) return error(res, 'الاسم ورقم الهاتف مطلوبان');

    const agent = await prisma.agent.create({
      data: { name, phone, commission: parseFloat(commission) }
    });

    await prisma.log.create({
      data: { action: 'CREATE_AGENT', details: `وكيل جديد: ${name}`, userId: req.user.id }
    });

    return success(res, agent, 'تم إضافة الوكيل بنجاح', 201);
  } catch (err) {
    if (err.code === 'P2002') return error(res, 'رقم الهاتف مستخدم مسبقاً');
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, commission, isActive } = req.body;
    const agent = await prisma.agent.update({
      where: { id: parseInt(id) },
      data: { name, phone, commission, isActive }
    });
    return success(res, agent, 'تم تحديث الوكيل');
  } catch (err) {
    return error(res, 'الوكيل غير موجود', 404);
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await prisma.transaction.count({ where: { agentId: parseInt(id) } });
    if (transactions > 0) return error(res, 'لا يمكن الحذف، للوكيل عمليات سابقة');

    await prisma.agent.delete({ where: { id: parseInt(id) } });
    return success(res, null, 'تم حذف الوكيل');
  } catch (err) {
    return error(res, 'خطأ في الحذف');
  }
};

exports.recharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount || amount <= 0) return error(res, 'المبلغ غير صالح');

    const agent = await prisma.agent.update({
      where: { id: parseInt(id) },
      data: { balance: { increment: parseFloat(amount) } }
    });

    await prisma.log.create({
      data: { action: 'RECHARGE_AGENT', details: `شحن ${amount} ريال للوكيل ${agent.name}`, userId: req.user.id }
    });

    return success(res, agent, `تم شحن ${amount} ريال لحساب ${agent.name}`);
  } catch (err) {
    return error(res, 'الوكيل غير موجود', 404);
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const agentId = req.user.agentId;
    if (!agentId) return error(res, 'غير مصرح', 403);

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { card: { include: { category: true } } }
        }
      }
    });
    if (!agent) return error(res, 'الوكيل غير موجود', 404);
    return success(res, agent);
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};
