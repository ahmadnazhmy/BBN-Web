import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faXmark, faEye } from '@fortawesome/free-solid-svg-icons';
import API_BASE_URL from '../api';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { id } from 'date-fns/locale';

function User() {
  const [userData, setUserData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [filterMonthYear, setFilterMonthYear] = useState(null);
  const [isAddingReward, setIsAddingReward] = useState(false);

  const showNotification = useCallback((msg, type = 'success', duration = 3000) => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, duration);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setError('Anda tidak memiliki izin. Silakan login kembali.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.');
          }
          throw new Error('Gagal mengambil data pelanggan.');
        }

        const data = await res.json();
        setUserData(data.users);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message || 'Terjadi kesalahan saat memuat data pelanggan.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [showNotification]);

  const handleViewHistory = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    setPurchaseHistory([]);
    setTotalPurchaseAmount(0);
    setFilterMonthYear(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${user.user_id}/purchase-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal mengambil riwayat pembayaran.');
      }

      const data = await res.json();
      setPurchaseHistory(data.history);

      const filteredForTotal = data.history.filter(
        record => record.status === 'completed' || record.status === 'dp_paid'
      );

      const calculatedTotal = filteredForTotal.reduce(
        (sum, record) => sum + record.total_price,
        0
      );
      setTotalPurchaseAmount(calculatedTotal);

    } catch (err) {
      console.error("Error fetching purchase history:", err);
      setHistoryError(err.message || 'Terjadi kesalahan saat memuat riwayat pembayaran.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddReward = async () => {
    if (!selectedUser) return;
    setIsAddingReward(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showNotification('Anda tidak memiliki izin. Silakan login kembali.', 'error');
        setIsAddingReward(false);
        return;
      }

      const generatedCode = `DISC${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiryDate = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0];

      const rewardData = {
        reward_type: 'Diskon Belanja',
        discount_percentage: 30,
        code: generatedCode,
        expiry_date: expiryDate,
        min_purchase_amount: 0,
        description: 'Diskon 30% untuk pembelanjaan berikutnya!'
      };

      const res = await fetch(`${API_BASE_URL}/user/${selectedUser.user_id}/add-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(rewardData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menambahkan reward.');
      }

      showNotification('Reward berhasil ditambahkan!', 'success');
      closeModal();
    } catch (err) {
      console.error("Error adding reward:", err);
      showNotification(err.message || 'Terjadi kesalahan saat menambahkan reward.', 'error');
    } finally {
      setIsAddingReward(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setPurchaseHistory([]);
    setTotalPurchaseAmount(0);
    setHistoryError(null);
    setFilterMonthYear(null);
    setIsAddingReward(false);
  };

  const filteredPurchaseHistory = purchaseHistory.filter(record => {
    const isRelevantStatus = record.status === 'completed' || record.status === 'dp_paid';
    if (!isRelevantStatus) {
      return false;
    }

    if (!filterMonthYear) {
      return true;
    }

    const recordDate = new Date(record.payment_date);
    const filterDate = filterMonthYear;

    return (
      recordDate.getFullYear() === filterDate.getFullYear() &&
      recordDate.getMonth() === filterDate.getMonth()
    );
  });

  const filteredUsers = userData.filter(user =>
    user.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6 text-center text-lg">Memuat data pelanggan...</div>;
  if (error) return <div className="p-6 text-center text-red-500 text-lg">Error: {error}</div>;

  return (
    <div className="px-6 pt-6 flex flex-col h-full bg-gray-50">
      <div className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Daftar Pelanggan</h1>

          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Cari Nama Toko..."
              className="p-2 pl-10 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
        {notification.message && (
          <div className={`mt-4 px-4 py-2 rounded-md text-sm ${
            notification.type === 'success' ? 'text-blue-800 bg-blue-100' : 'text-red-800 bg-red-100'
          }`}>
            {notification.message}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm flex-grow overflow-hidden">
        <div className="max-h-[80vh] overflow-auto">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="w-48 px-4 py-3 text-left font-semibold text-gray-700">Nama Toko</th>
                <th className="w-64 px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="w-40 px-4 py-3 text-left font-semibold text-gray-700">No. Telepon</th>
                <th className="w-[300px] px-4 py-3 text-left font-semibold text-gray-700">Alamat</th>
                <th className="w-40 px-4 py-3 text-left font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    Tidak ada hasil ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.user_id} className="border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 truncate">{user.shop_name}</td>
                    <td className="px-4 py-3 truncate">{user.email}</td>
                    <td className="px-4 py-3">{user.phone}</td>
                    <td className="px-4 py-3">{user.address}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewHistory(user)}
                        className="text-white w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4 transition-all duration-300 ease-out transform">
          <div
              className={`
                bg-white rounded-lg shadow-xl max-w-4xl w-full relative p-6
                transition-all duration-300 ease-out transform
              `}
            >
            <div className="flex justify-between items-center p-4 border-b border-black">
              <h2 className="text-xl font-bold">
                Riwayat Pembayaran: {selectedUser.shop_name}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faXmark} className='text-xl md:text-3xl' />
              </button>
            </div>

            <div className="p-4 flex-grow overflow-auto">
              {historyLoading ? (
                <div className="text-center text-lg py-8">Memuat riwayat pembayaran...</div>
              ) : historyError ? (
                <div className="text-center text-red-500 text-lg py-8">Error: {historyError}</div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-4">
                    <label htmlFor="monthFilter" className="font-semibold">Filter Bulan:</label>
                    <DatePicker
                      selected={filterMonthYear}
                      onChange={date => setFilterMonthYear(date)}
                      dateFormat="MM/yyyy"
                      showMonthYearPicker
                      className="bg-white text-center border border-gray-300 text-sm px-4 py-2 rounded-md w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholderText="Pilih Bulan"
                      locale={id}
                    />
                      {filterMonthYear && (
                        <button
                            onClick={() => setFilterMonthYear(null)}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Reset Filter
                        </button>
                    )}
                  </div>

                  {filteredPurchaseHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {filterMonthYear ? `Tidak ada riwayat pembayaran dengan status 'completed' atau 'dp_paid' untuk bulan ${new Date(filterMonthYear).toLocaleString('id-ID', { year: 'numeric', month: 'long' })}.` : 'Belum ada riwayat pembayaran dengan status "completed" atau "dp_paid".'}
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-lg font-bold">
                        Total Pembelian: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPurchaseAmount)}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-700 border border-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold border-b border-gray-200">No</th>
                              <th className="px-4 py-2 text-left font-semibold border-b border-gray-200">Tanggal</th>
                              <th className="px-4 py-2 text-left font-semibold border-b border-gray-200">Jenis Pembayaran</th>
                              <th className="px-4 py-2 text-right font-semibold border-b border-gray-200">Jumlah</th>
                              <th className="px-4 py-2 text-left font-semibold border-b border-gray-200">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPurchaseHistory.map((record, index) => (
                              <tr key={record.payment_id} className="border-b border-gray-100 even:bg-gray-50">
                                <td className="px-4 py-2">{index + 1}</td>
                                <td className="px-4 py-2">
                                  {new Date(record.payment_date).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </td>
                                <td className="px-4 py-2">{record.description_or_product_name || 'N/A'}</td>
                                <td className="px-4 py-2 text-right">
                                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(record.total_price)}
                                </td>
                                <td className="px-4 py-2">{record.status || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="p-4 text-right">
              <button
                onClick={handleAddReward}
                disabled={isAddingReward}
                className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${isAddingReward ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isAddingReward ? 'Menambahkan...' : 'Tambahkan Reward (Diskon 30%)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default User;