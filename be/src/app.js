const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron'); 
const cancelOverdueOrders = require('./tasks/cancelOverdueOrders');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

const app = express();

const allowedOrigins = [
  'https://bbn-web-ahmad-nazhmy-zahrians-projects.vercel.app',
  'https://bbn-web-i9wq.vercel.app',
  'http://localhost:5173',
  'http://localhost:5175',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

if (process.env.UPLOAD_TARGET === 'local') {
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/productRoutes'));
app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/profileRoutes'));
app.use('/api', require('./routes/cartRoutes'));
app.use('/api', require('./routes/orderRoutes'));
app.use('/api', require('./routes/paymentRoutes'));
app.use('/api', require('./routes/historyRoutes'));
app.use('/api', require('./routes/notificationRoutes'));
app.use('/api', require('./routes/dashboardRoutes'));
app.use('/api', require('./routes/rewardRoutes'));

app.get('/', (req, res) => {
  res.send('API berjalan');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

cron.schedule('*/1 * * * *', cancelOverdueOrders);
cancelOverdueOrders();

module.exports = app;
