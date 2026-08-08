const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const prisma = require('./src/config/database');

// Routes
const authRoutes = require('./src/routes/auth');
const categoryRoutes = require('./src/routes/categories');
const agentRoutes = require('./src/routes/agents');
const cardRoutes = require('./src/routes/cards');
const transactionRoutes = require('./src/routes/transactions');
const logRoutes = require('./src/routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'تم تجاوز الحد المسموح من الطلبات' }
});
app.use('/api/', limiter);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'نظام إدارة كروت الشحن يعمل بنجاح',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/logs', logRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'خطأ في الخادم',
    data: null
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود',
    data: null
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📡 الرابط: http://localhost:${PORT}`);
});
