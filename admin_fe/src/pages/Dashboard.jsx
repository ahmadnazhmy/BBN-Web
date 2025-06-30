import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBoxOpen, faShoppingCart, faMoneyBillWave, faCheckCircle, faTimesCircle, faChartLine, faChartBar } from '@fortawesome/free-solid-svg-icons';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    payments: {
      success: 0,
      failed: 0,
      successAmount: 0
    }
  });

  const [monthlySales, setMonthlySales] = useState([]);
  const [stockChanges, setStockChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = useCallback((msg, type = 'success', duration = 3000) => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, duration);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          showNotification('Anda tidak memiliki izin. Silakan login kembali.', 'error');
          setError('Unauthorized: No token found.');
          setLoading(false);
          return;
        }

        const res = await fetch('https://bbn-web-production.up.railway.app/api/summary', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            showNotification('Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.', 'error');
            setError('Unauthorized: Invalid or expired token.');
          } else {
            showNotification('Gagal memuat data dashboard.', 'error');
            const errorText = await res.text();
            setError(`Failed to fetch dashboard data: ${res.status} - ${errorText}`);
          }
          setLoading(false);
          return;
        }

        const data = await res.json();

        const processedStats = data.stats || data;
        if (!processedStats.payments) {
          processedStats.payments = { success: 0, failed: 0 };
        }

        setStats(processedStats);
        setMonthlySales(data.monthlySales || []);
        setStockChanges(data.stockChanges || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        showNotification(err.message || 'Terjadi kesalahan saat memuat data dashboard.', 'error');
        setError(err.message || 'An unexpected error occurred.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showNotification]);

  const statIcons = {
    totalUsers: faUsers,
    totalProducts: faBoxOpen,
    totalOrders: faShoppingCart,
    totalRevenue: faMoneyBillWave,
    paymentsSuccess: faCheckCircle,
    paymentsFailed: faTimesCircle,
  };

  if (loading) {
    return <div className="p-6 text-center text-lg">Memuat data dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500 text-lg">Error: {error}</div>;
  }

  return (
    <div className="px-6 pt-6 flex flex-col h-full bg-gray-50">
      <div className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
        {notification.message && (
          <div className={`mt-4 px-4 py-2 rounded-md text-sm ${
            notification.type === 'success' ? 'text-blue-800 bg-blue-100' : 'text-red-800 bg-red-100'
          }`}>
            {notification.message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Pelanggan" value={stats.totalUsers} icon={statIcons.totalUsers} bgColor="bg-blue-50" iconBg="bg-blue-100" iconColor="text-blue-600" />
        <StatCard title="Total Produk" value={stats.totalProducts} icon={statIcons.totalProducts} bgColor="bg-green-50" iconBg="bg-green-100" iconColor="text-green-600" />
        <StatCard title="Total Pesanan" value={stats.totalOrders} icon={statIcons.totalOrders} bgColor="bg-purple-50" iconBg="bg-purple-100" iconColor="text-purple-600" />
        <StatCard title="Total Pendapatan" value={`Rp ${(stats.payments?.successAmount || 0).toLocaleString('id-ID')}`} icon={statIcons.totalRevenue} bgColor="bg-yellow-50" iconBg="bg-yellow-100" iconColor="text-yellow-600" />
        <StatCard title="Pembayaran Berhasil" value={stats.payments?.success || 0} icon={statIcons.paymentsSuccess} bgColor="bg-teal-50" iconBg="bg-teal-100" iconColor="text-teal-600" />
        <StatCard title="Pembayaran Gagal" value={stats.payments?.failed || 0} icon={statIcons.paymentsFailed} bgColor="bg-red-50" iconBg="bg-red-100" iconColor="text-red-600" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faChartLine} className="mr-2 text-blue-600" />
          Grafik Penjualan per Bulan
        </h2>
        {monthlySales.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={monthlySales}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `Rp${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip formatter={(v) => `Rp${v.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                name="Penjualan"
                stroke="#4299e1"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">(Tidak ada data penjualan untuk ditampilkan)</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FontAwesomeIcon icon={faChartBar} className="mr-2 text-green-600" />
          Grafik Perubahan Stok
        </h2>
        {stockChanges.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={stockChanges}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="item" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="jumlah" name="Jumlah" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">(Tidak ada data perubahan stok untuk ditampilkan)</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, iconBg, iconColor }) {
  return (
    <div className={`${bgColor} rounded-lg shadow-sm p-4 flex items-center space-x-4`}>
      <div className={`${iconBg} ${iconColor} rounded-full flex-shrink-0 p-3`}>
        <FontAwesomeIcon icon={icon} size="lg" />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

export default Dashboard;
