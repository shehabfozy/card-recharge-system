# 🎯 نظام إدارة كروت الشحن

نظام Backend كامل لإدارة كروت الإنترنت والوكلاء باستخدام Node.js/Express + PostgreSQL + Prisma.

## 🚀 التقنيات المستخدمة

- **Node.js 18+** + **Express**
- **PostgreSQL** (قاعدة البيانات)
- **Prisma ORM** (إدارة قاعدة البيانات)
- **JWT** (مصادقة المستخدمين)
- **bcryptjs** (تشفير كلمات المرور)
- **Helmet + Rate Limit** (الأمان)

## 📁 هيكل المشروع

```
card-recharge-system/
├── prisma/
│   └── schema.prisma          # نموذج قاعدة البيانات
├── src/
│   ├── config/
│   │   └── database.js        # إعداد Prisma Client
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── agentController.js
│   │   ├── cardController.js
│   │   ├── transactionController.js
│   │   └── logController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT Middleware
│   │   └── upload.js          # Multer لرفع الملفات
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── agents.js
│   │   ├── cards.js
│   │   ├── transactions.js
│   │   └── logs.js
│   └── utils/
│       └── response.js        # معيار الردود
├── server.js                  # نقطة الدخول
├── seed.js                    # بيانات أولية
├── railway.json               # إعدادات Railway
├── Procfile                   # إعدادات Heroku/Railway
├── .env.example               # نموذج المتغيرات
└── package.json
```

## ⚙️ التثبيت المحلي

```bash
# 1. نسخ المستودع
git clone <repo-url>
cd card-recharge-system

# 2. تثبيت الحزم
npm install

# 3. إعداد المتغيرات
cp .env.example .env
# عدل DATABASE_URL و JWT_SECRET في ملف .env

# 4. تطبيق migrations على قاعدة البيانات
npx prisma migrate dev --name init

# 5. إنشاء بيانات أولية (مدير + فئات)
node seed.js

# 6. تشغيل الخادم
npm run dev
```

## 🔐 بيانات الدخول الافتراضية

| الدور | اسم المستخدم | كلمة المرور |
|-------|-------------|-------------|
| مدير  | `admin`     | `admin123`  |

> ⚠️ **مهم:** غيّر كلمة المرور الافتراضية فوراً!

## 🌐 الـ API Endpoints

### المصادقة
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/api/auth/login` | تسجيل الدخول |
| GET  | `/api/auth/me` | معلومات المستخدم الحالي |
| POST | `/api/auth/admin` | إنشاء مدير جديد (admin فقط) |

### الفئات
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET  | `/api/categories` | قائمة الفئات |
| POST | `/api/categories` | إضافة فئة جديدة |
| PUT  | `/api/categories/:id` | تعديل فئة |
| DELETE | `/api/categories/:id` | حذف فئة |

### الوكلاء
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET  | `/api/agents` | قائمة الوكلاء |
| GET  | `/api/agents/me` | بروفايل الوكيل الحالي |
| GET  | `/api/agents/:id` | تفاصيل وكيل |
| POST | `/api/agents` | إضافة وكيل |
| PUT  | `/api/agents/:id` | تعديل وكيل |
| DELETE | `/api/agents/:id` | حذف وكيل |
| POST | `/api/agents/:id/recharge` | شحن رصيد وكيل |

### الكروت
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET  | `/api/cards` | قائمة الكروت (مع pagination) |
| GET  | `/api/cards/stats` | إحصائيات الكروت |
| POST | `/api/cards/import` | استيراد كروت (JSON array) |
| POST | `/api/cards/import-file` | استيراد من ملف .txt |
| POST | `/api/cards/sell` | بيع كرت للزبون |

### العمليات
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET  | `/api/transactions` | سجل العمليات |
| GET  | `/api/transactions/me` | عمليات الوكيل الحالي |
| GET  | `/api/transactions/dashboard` | لوحة التحكم الإحصائية |

### السجلات
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET  | `/api/logs` | سجل أحداث النظام |

## 🚀 النشر على Railway

### 1. رفع الكود على GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/card-recharge-system.git
git push -u origin main
```

### 2. إنشاء مشروع على Railway
1. اذهب إلى [railway.app](https://railway.app) وسجّل دخول
2. اضغط **New Project**
3. اختر **Deploy from GitHub repo**
4. اختر مستودع `card-recharge-system`
5. Railway سيتعرف تلقائياً على Node.js

### 3. إضافة PostgreSQL
1. في لوحة المشروع، اضغط **New** → **Database** → **Add PostgreSQL**
2. Railway سيُنشئ قاعدة بيانات ويُضيف `DATABASE_URL` تلقائياً
3. لا حاجة لإضافة أي متغير يدوياً!

### 4. إضافة متغيرات البيئة
1. اذهب إلى **Variables** في لوحة المشروع
2. أضف:
   - `JWT_SECRET` = مفتاح عشوائي قوي (مثلاً: `xJ9#mK2$pL5@vN8*qR4`)
   - `NODE_ENV` = `production`
3. اضغط **Deploy** وسيتم البناء والنشر تلقائياً

### 5. التهيئة الأولية
بعد أول نشر، افتح **Shell** من لوحة Railway ونفّذ:
```bash
npx prisma migrate deploy
node seed.js
```

### 6. الحصول على الرابط
- اذهب إلى **Settings** → **Domains**
- Railway يُعطيك رابط مجاني تلقائياً (مثلاً: `card-recharge-system.up.railway.app`)

## 📱 إرسال واتساب

عند بيع كرت، يُرجع الـ API رابط واتساب جاهز:
```json
{
  "success": true,
  "data": {
    "card": { ... },
    "whatsappUrl": "https://wa.me/966501234567?text=...",
    "message": "✅ كرت شحن إنترنت\n💳 الكرت: 123456..."
  }
}
```

## 🔒 الأمان

- كل كلمات المرور مشفرة بـ bcrypt
- JWT tokens مع صلاحية محددة
- Rate limiting لحماية من الهجمات
- Helmet لحماية الـ Headers
- Prisma يحمي من SQL Injection

## 💰 تكلفة Railway

| الخطة | السعر | التفاصيل |
|-------|-------|----------|
| **Trial** | $5 مجاناً | رصيد تجريبي يكفي لشهرين تقريباً |
| **Hobby** | $5/شهر | 24/7 uptime + 10GB traffic |
| **Pro** | $20/شهر | للمشاريع الكبيرة |

> 💡 **نصيحة:** Railway لا يدخل في وضع السكون مثل Render! الخادم يبقى شغال 24/7 حتى في الخطة المجانية (طالما الرصيد متوفر).

## 📄 الترخيص

MIT License - حر في الاستخدام والتعديل.
