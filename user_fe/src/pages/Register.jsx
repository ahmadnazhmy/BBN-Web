import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faStore, faPhone, faMapMarkerAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import API_BASE_URL from '../api';

function Register() {
  const [shop_name, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const secretKey = 'your_super_secret_key_32char';

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setSuccess('');

    if (!shop_name.trim()) {
      setError('Nama Toko tidak boleh kosong.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email tidak valid. Pastikan format email sudah benar.');
      return;
    }
    if (!phone.trim() || !/^\d+$/.test(phone) || phone.length < 12) {
      setError('Nomor Telepon tidak valid. Pastikan hanya angka dan minimal 12 karakter.');
      return;
    }
    if (!address.trim()) {
      setError('Alamat tidak boleh kosong.');
      return;
    }
    if (password.length < 6) {
      setError('Password harus memiliki setidaknya 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setLoading(true);

    const data = { shop_name, email, phone, address, password };
    const encrypted = encryptData(data);

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message || 'Pendaftaran berhasil! Anda akan dialihkan ke halaman login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message || 'Pendaftaran gagal. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error saat mengirim data:', error);
      setError('Terjadi kesalahan jaringan atau server. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-xl shadow-2xl animate-fade-in-up transform transition-all duration-500 ease-in-out">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Daftar Akun Baru</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center text-sm" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 text-center text-sm" role="alert">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <FontAwesomeIcon icon={faStore} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Nama Toko Anda"
              value={shop_name}
              onChange={(e) => setShopName(e.target.value)}
              required
              aria-label="Nama Toko"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-base transition duration-200"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="email"
              placeholder="Email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-base transition duration-200"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faPhone} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="tel"
              placeholder="Nomor Telepon (contoh: 081234567890)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              aria-label="Nomor Telepon"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-base transition duration-200"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Alamat Lengkap Anda"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              aria-label="Alamat"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-base transition duration-200"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="password"
              placeholder="Buat Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Kata Sandi"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-base transition duration-200"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="password"
              placeholder="Konfirmasi Kata Sandi"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-label="Konfirmasi Kata Sandi"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-base transition duration-200"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="text-xl" />
                <span>Mendaftar...</span>
              </>
            ) : (
              'Daftar'
            )}
          </button>
        </form>
        <p className="text-center text-gray-600 mt-6 text-base">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition duration-200">
            Masuk di sini
          </Link>
        </p>

        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
}

export default Register;