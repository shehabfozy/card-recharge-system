const prisma = require('../config/database');
const { success, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const { categoryId, status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (status) where.status = status;

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { category: true, agent: { select: { name: true } } }
      }),
      prisma.card.count({ where })
    ]);

    return success(res, { cards, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.importCards = async (req, res) => {
  try {
    const { categoryId, codes } = req.body;
    if (!categoryId || !codes || !Array.isArray(codes) || codes.length === 0) {
      return error(res, 'الفئة والكروت مطلوبة');
    }

    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
    if (!category) return error(res, 'الفئة غير موجودة', 404);

    // فلترة الكروت الفريدة
    const uniqueCodes = [...new Set(codes.map(c => c.trim()).filter(c => c.length > 0))];

    // التحقق من الكروت المكررة
    const existing = await prisma.card.findMany({
      where: { code: { in: uniqueCodes } },
      select: { code: true }
    });
    const existingCodes = new Set(existing.map(e => e.code));
    const newCodes = uniqueCodes.filter(c => !existingCodes.has(c));

    if (newCodes.length === 0) return error(res, 'جميع الكروت موجودة مسبقاً');

    const result = await prisma.card.createMany({
      data: newCodes.map(code => ({
        code,
        categoryId: parseInt(categoryId),
        status: 'available'
      })),
      skipDuplicates: true
    });

    await prisma.log.create({
      data: { action: 'IMPORT_CARDS', details: `استيراد ${result.count} كرت لفئة ${category.price} ريال`, userId: req.user.id }
    });

    return success(res, { imported: result.count, duplicates: uniqueCodes.length - newCodes.length }, 'تم الاستيراد بنجاح');
  } catch (err) {
    console.error(err);
    return error(res, 'خطأ في الاستيراد', 500);
  }
};

exports.importFromFile = async (req, res) => {
  try {
    const { categoryId } = req.body;
    if (!req.file) return error(res, 'الملف مطلوب');
    if (!categoryId) return error(res, 'الفئة مطلوبة');

    const content = req.file.buffer.toString('utf-8');
    const codes = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    req.body.codes = codes;
    return exports.importCards(req, res);
  } catch (err) {
    return error(res, 'خطأ في قراءة الملف', 500);
  }
};

exports.sellCard = async (req, res) => {
  try {
    const { categoryId, phone } = req.body;
    const agentId = req.user.agentId;

    if (!agentId) return error(res, 'غير مصرح، يجب تسجيل الدخول كوكيل', 403);
    if (!categoryId || !phone) return error(res, 'الفئة ورقم الهاتف مطلوبان');

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive) return error(res, 'الوكيل غير موجود أو غير مفعل', 404);

    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
    if (!category) return error(res, 'الفئة غير موجودة', 404);

    // حساب التكلفة (السعر - العمولة)
    const commission = category.price * (agent.commission / 100);
    const cost = category.price - commission;

    if (agent.balance < cost) {
      return error(res, `رصيدك غير كافٍ. الرصيد: ${agent.balance} ريال، المطلوب: ${cost} ريال`);
    }

    // البحث عن كرت متاح
    const card = await prisma.card.findFirst({
      where: { categoryId: parseInt(categoryId), status: 'available' },
      include: { category: true }
    });

    if (!card) return error(res, 'عذراً، لا توجد كروت متاحة في هذه الفئة');

    // تنفيذ البيع في معاملة واحدة
    const result = await prisma.$transaction(async (tx) => {
      // تحديث الكرت
      const updatedCard = await tx.card.update({
        where: { id: card.id },
        data: {
          status: 'sold',
          soldTo: phone,
          agentId: agent.id,
          soldAt: new Date()
        }
      });

      // خصم الرصيد
      await tx.agent.update({
        where: { id: agent.id },
        data: { balance: { decrement: cost } }
      });

      // إنشاء العملية
      const transaction = await tx.transaction.create({
        data: {
          cardId: card.id,
          agentId: agent.id,
          phone,
          price: category.price,
          commission,
          netAmount: cost
        }
      });

      return { card: updatedCard, transaction };
    });

    // إنشاء رابط واتساب
    const message = `✅ كرت شحن إنترنت\n💳 الكرت: ${card.code}\n💰 الفئة: ${category.price} ريال\n📊 البيانات: ${category.dataSize} ميجا\n⏰ الساعات: ${category.hours} ساعة\n📅 الصلاحية: ${category.days} يوم\n\nشكراً لاستخدامكم خدمتنا!`;
    const whatsappUrl = `https://wa.me/${phone.replace(/^0/, '966')}?text=${encodeURIComponent(message)}`;

    await prisma.log.create({
      data: { action: 'SELL_CARD', details: `وكيل ${agent.name} باع كرت ${category.price} ريال للرقم ${phone}` }
    });

    return success(res, {
      card: result.card,
      transaction: result.transaction,
      whatsappUrl,
      message
    }, 'تم بيع الكرت بنجاح');
  } catch (err) {
    console.error(err);
    return error(res, 'خطأ في البيع', 500);
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, available, sold, categoriesCount, agentsCount] = await Promise.all([
      prisma.card.count(),
      prisma.card.count({ where: { status: 'available' } }),
      prisma.card.count({ where: { status: 'sold' } }),
      prisma.category.count(),
      prisma.agent.count()
    ]);

    const revenue = await prisma.transaction.aggregate({ _sum: { netAmount: true } });

    return success(res, {
      totalCards: total,
      availableCards: available,
      soldCards: sold,
      categories: categoriesCount,
      agents: agentsCount,
      totalRevenue: revenue._sum.netAmount || 0
    });
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};
