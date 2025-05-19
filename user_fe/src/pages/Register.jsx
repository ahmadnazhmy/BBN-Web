import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faStore, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js'; 

function Register() {
  const [shop_name, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const secretKey = 'your_super_secret_key_32char'; 

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = { shop_name, email, phone, address, password };
    const encrypted = encryptData(data);

    try {
      const response = await fetch('https://precious-eagerness.up.railway.app/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted }),
      });

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error saat mengirim data:', error);
      alert('Terjadi kesalahan saat mendaftar. Silakan coba lagi!');
    }
  };

  return (
    <div className="flex items-center justify-center md:min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 md:rounded-xs md:shadow-lg md:bg-white">
        <h2 className="text-2xl font-bold text-center mb-8">Daftar Akun</h2>
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
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full py-2 bg-blue-800 text-white rounded-md hover:bg-blue-900 transition duration-200"
          >
            Daftar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
