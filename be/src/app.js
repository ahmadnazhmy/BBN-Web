const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron'); 
const cancelOverdueOrders = require('./tasks/cancelOverdueOrders');

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

const app = express();

if (process.env.UPLOAD_TARGET === 'local') {
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
}

const productRouter = require('./routes/productRoutes');
const authRouter = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const historyRoutes = require('./routes/historyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const rewardRoutes = require('./routes/rewardRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  next();
});

const allowedOrigins = [
  'https://bbn-web-ahmad-nazhmy-zahrians-projects.vercel.app',
  'https://bbn-web-i9wq.vercel.app',
  'http://localhost:5173',
  'http://localhost:5175',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use('/api', productRouter);
app.use('/api', authRouter);
app.use('/api', profileRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', historyRoutes);
app.use('/api', notificationRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', rewardRoutes)

app.get('/', (req, res) => {
  res.send('API berjalan');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

cron.schedule('*/1 * * * *', () => {
    cancelOverdueOrders();
});

cancelOverdueOrders();

module.exports = app;