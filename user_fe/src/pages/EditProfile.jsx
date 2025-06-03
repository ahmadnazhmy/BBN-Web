import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faStore, faPhone, faMapMarkerAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Nav from '../components/Nav';
import { useNavigate } from 'react-router-dom';

function EditProfile() {
  const [shop_name, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('https://bbn-web-production.up.railway.app/api/profile', {
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
        } else {
          setError(result.message || 'Gagal memuat data profil.');
          if (res.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Terjadi kesalahan jaringan saat memuat profil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!shop_name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError('Semua kolom harus diisi.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email tidak valid. Pastikan format email sudah benar.');
      return;
    }
    if (!/^\d+$/.test(phone) || phone.length < 12) {
      setError('Nomor Telepon tidak valid. Pastikan hanya angka dan minimal 12 karakter.');
      return;
    }

    setIsSubmitting(true);

    const updatedData = { shop_name, email, phone, address };

    try {
      const res = await fetch('https://bbn-web-production.up.railway.app/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const result = await res.json();

      if (res.ok) {
        setSuccess('Profil berhasil diperbarui!');
      } else {
        setError(result.message || 'Gagal memperbarui profil.');
      }
    } catch (error) {
      console.error('Error submitting profile update:', error);
      setError('Terjadi kesalahan jaringan atau server saat menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Nav />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-xl shadow-2xl animate-fade-in-up">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Edit Profil Anda</h2>

          {loading ? ( 
            <div className="flex justify-center items-center h-40">
              <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-4xl" />
              <p className="ml-4 text-gray-700 text-lg">Memuat profil...</p>
            </div>
          ) : (
            <>
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

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 flex items-center justify-center gap-2"
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="text-xl" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

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
  );
}

export default EditProfile;