import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function User() {
  const [userData, setUserData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setError('Anda tidak memiliki izin. Silakan login kembali.');
          setLoading(false);
          return;
        }

        const res = await fetch('https://bbn-web-production.up.railway.app/api/user', {
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
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default User;