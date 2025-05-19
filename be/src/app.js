const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
require('dotenv').config();

const productRouter = require('./routes/productRoutes');
const authRouter = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const historyRoutes = require('./routes/historyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Tambahkan middleware logging untuk cek origin header masuk
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
});

const allowedOrigins = [
  'https://bbn-ra17opt8q-ahmad-nazhmy-zahrians-projects.vercel.app',
  'https://bbn-web-i9wq.vercel.app',
  'http://localhost:5173',
];

// Opsi CORS untuk produksi (spesifik origin)
const corsOptions = {
  origin: function (origin, callback) {
    // Jika request dari tools seperti Postman yang tidak ada origin, izinkan juga
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// -- UNTUK TESTING --
// Jika ingin test sementara tanpa CORS error, bisa pakai ini:
// app.use(cors({ origin: '*', credentials: false }));

// Gunakan corsOptions di sini:
app.use(cors(corsOptions));

// Router
app.use('/api', productRouter);
app.use('/api', authRouter);
app.use('/api', profileRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', historyRoutes);
app.use('/api', notificationRoutes);
app.use('/api', dashboardRoutes);

app.get('/', (req, res) => {
  res.send('API berjalan');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

module.exports = app;
