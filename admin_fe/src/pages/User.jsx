import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function User() {
  const [userData, setUserData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }

        const res = await fetch('https://bbn-web-production.up.railway.app/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch user data');

        const data = await res.json();
        setUserData(data.users);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Error fetching user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const filteredUsers = userData.filter(user =>
    user.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6">Memuat...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 md:px-6 md:py-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-xl font-bold py-2">Daftar Pelanggan</h1>

        <div className="relative w-full md:w-1/3 mt-2 md:mt-0 ">
          <input
            type="text"
            placeholder="Cari Nama Toko..."
            className="p-2 pl-10 border border-gray-300 rounded-xs w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-500" />
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-xs">
        <div className="max-h-[85vh] overflow-y-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-12 px-4 py-3 border-b border-gray-300 text-left">No</th>
              <th className="w-48 px-4 py-3 border-b border-gray-300 text-left">Nama Toko</th>
              <th className="w-64 px-4 py-3 border-b border-gray-300 text-left">Email</th>
              <th className="w-40 px-4 py-3 border-b border-gray-300 text-left">No. Telepon</th>
              <th className="w-[300px] px-4 py-3 border-b border-gray-300 text-left">Alamat</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b border-gray-300">{index + 1}</td>
                <td className="px-4 py-3 border-b border-gray-300 truncate">{user.shop_name}</td>
                <td className="px-4 py-3 border-b border-gray-300 truncate">{user.email}</td>
                <td className="px-4 py-3 border-b border-gray-300">{user.phone}</td>
                <td className="px-4 py-3 border-b border-gray-300">{user.address}</td>
              </tr>
            ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-6 text-center text-gray-500 border-b border-gray-300"
                    style={{ height: '60px' }}
                  >
                    Tidak ada hasil ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default User;
