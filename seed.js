const bcrypt = require('bcryptjs');
const prisma = require('./src/config/database');

async function seed() {
  try {
    console.log('🌱 بدء تهيئة البيانات...');

    // إنشاء مدير افتراضي
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('✅ تم إنشاء المدير الافتراضي:');
      console.log('   اسم المستخدم: admin');
      console.log('   كلمة المرور: admin123');
    } else {
      console.log('ℹ️ المدير موجود مسبقاً');
    }

    // إنشاء فئات افتراضية
    const categories = [
      { price: 100, dataSize: 5000, hours: 168, days: 30 },
      { price: 200, dataSize: 12000, hours: 336, days: 60 },
      { price: 300, dataSize: 20000, hours: 720, days: 90 }
    ];

    for (const cat of categories) {
      const exists = await prisma.category.findFirst({ where: { price: cat.price } });
      if (!exists) {
        await prisma.category.create({ data: cat });
        console.log(`✅ تم إنشاء فئة ${cat.price} ريال`);
      }
    }

    console.log('🎉 تمت التهيئة بنجاح!');
  } catch (err) {
    console.error('❌ خطأ في التهيئة:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
