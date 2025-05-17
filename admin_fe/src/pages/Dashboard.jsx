import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    unreadNotifications: 0,
    payments: {
      success: 0,
      failed: 0
    }
  });

  const [monthlySales, setMonthlySales] = useState([]);
  const [stockChanges, setStockChanges] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/summary', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        const statsData = data.stats || data;
        if (!statsData.payments) {
            statsData.payments = { success: 0, failed: 0 };
        }
        setStats(statsData);
        setMonthlySales(data.monthlySales || []);
        setStockChanges(data.stockChanges || []);
        })
      .catch(err => {
        console.error('Gagal memuat data dashboard:', err);
      });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold pt-2">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Jumlah Pengguna" value={stats.totalUsers} />
        <StatCard title="Jumlah Produk" value={stats.totalProducts} />
        <StatCard title="Total Pesanan" value={stats.totalOrders} />
        <StatCard title="Total Pendapatan" value={`Rp ${stats.totalRevenue.toLocaleString()}`} />
        <StatCard title="Pembayaran Berhasil" value={stats.payments ? stats.payments.success : 0} />
        <StatCard title="Pembayaran Gagal" value={stats.payments ? stats.payments.failed : 0} />
      </div>

      <div>
        <h2 className="font-bold mb-2">Grafik Penjualan per Bulan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlySales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => `Rp${(v / 1000000).toFixed(1)}jt`} />
            <Tooltip formatter={(v) => `Rp${v.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="sales" name="Penjualan" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="font-bold mb-2">Grafik Stok Masuk & Keluar</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stockChanges}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="item" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="jumlah" name="Jumlah" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-gray-100 rounded-xs p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

export default Dashboard;
