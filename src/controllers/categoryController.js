const prisma = require('../config/database');
const { success, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
    return success(res, categories);
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { price, dataSize, hours, days } = req.body;
    if (!price || !dataSize || !hours || !days) {
      return error(res, 'جميع الحقول مطلوبة');
    }

    const category = await prisma.category.create({
      data: { price: parseFloat(price), dataSize: parseInt(dataSize), hours: parseInt(hours), days: parseInt(days) }
    });

    await prisma.log.create({
      data: { action: 'CREATE_CATEGORY', details: `فئة جديدة: ${price} ريال`, userId: req.user.id }
    });

    return success(res, category, 'تم إنشاء الفئة بنجاح', 201);
  } catch (err) {
    return error(res, 'خطأ في الخادم', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, dataSize, hours, days, isActive } = req.body;
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { price, dataSize, hours, days, isActive }
    });
    return success(res, category, 'تم تحديث الفئة');
  } catch (err) {
    return error(res, 'الفئة غير موجودة', 404);
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    // تحقق من عدم وجود كروت مرتبطة
    const cardsCount = await prisma.card.count({ where: { categoryId: parseInt(id) } });
    if (cardsCount > 0) return error(res, 'لا يمكن الحذف، توجد كروت مرتبطة بهذه الفئة');

    await prisma.category.delete({ where: { id: parseInt(id) } });
    return success(res, null, 'تم حذف الفئة');
  } catch (err) {
    return error(res, 'خطأ في الحذف');
  }
};
