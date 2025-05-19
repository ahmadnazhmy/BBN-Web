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

const allowedOrigins = [
  'https://bbn-ra17opt8q-ahmad-nazhmy-zahrians-projects.vercel.app',
  'https://bbn-web-i9wq.vercel.app',
  'http://localhost:5173',  
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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

app.get('/', (req, res) => {
  res.send('API berjalan');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

module.exports = app;
