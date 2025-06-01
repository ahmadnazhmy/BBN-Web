import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setError('Password harus memiliki setidaknya 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://bbn-web-production.up.railway.app/api/admin/register', {
        username,
        password, 
      });

      if (response.status === 201) {
        setSuccess('Akun admin berhasil didaftarkan! Anda akan diarahkan ke halaman login.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Error selama pendaftaran admin:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Pendaftaran admin gagal. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-xl shadow-2xl animate-fade-in-up transform transition-all duration-500 ease-in-out">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Daftar Akun Admin</h2>
        
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
            <FontAwesomeIcon 
              icon={faUser} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" 
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              aria-label="Username"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 text-base transition duration-200"
            />
          </div>
          <div className="relative">
            <FontAwesomeIcon 
              icon={faLock} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" 
            />
            <input
              type="password"
              placeholder="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
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
              'Daftar Admin'
            )}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-base">
          Sudah punya akun admin?{' '}
          <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold transition duration-200">
            Login di sini
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