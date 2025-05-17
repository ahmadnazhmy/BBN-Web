import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faStore, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import Nav from '../components/Nav';
import { useNavigate } from 'react-router-dom';

function EditProfile() {
  const [shop_name, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login'); 
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await res.json();

        if (res.ok) {
          setShopName(result.shop_name || '');
          setEmail(result.email || '');
          setPhone(result.phone || '');
          setAddress(result.address || '');
        }
      } catch (err) {
        console.error('Gagal mengambil profil:', err);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedData = { shop_name, email, phone, address };

    try {
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const result = await res.json();

      if (res.ok) {
        alert('Profil berhasil diperbarui!');
      } else {
        alert(result.message || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Gagal mengirim perubahan:', error);
    }
  };

  return (
    <div>
      <Nav />
      <div className="flex items-center justify-center md:h-[90vh] bg-gray-100">
        <div className="w-full max-w-md md:bg-white p-4 md:p-8 md:rounded-xs md:shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-8">Edit Profil</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <FontAwesomeIcon icon={faStore} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Nama Toko"
                  value={shop_name}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  className="bg-white w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="relative">
                <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="No Telepon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="bg-white w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="relative">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Alamat"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="bg-white w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full py-2 bg-blue-800 text-white rounded-xs hover:bg-blue-900 transition duration-200"
            >
              Simpan Perubahan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
