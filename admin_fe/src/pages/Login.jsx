import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('https://bbn-web-production.up.railway.app/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', result.token);
        navigate('/dashboard');
      } else {
        setError(result.message || 'Username atau password salah. Silakan coba lagi.');
      }
    } catch (networkError) {
      console.error('Error saat login admin:', networkError);
      setError('Terjadi kesalahan jaringan atau server. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-xl shadow-2xl animate-fade-in-up transform transition-all duration-500 ease-in-out">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Login Sebagai Admin</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center text-sm" role="alert">
            {error}
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
                <span>Memproses...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <p className="text-center text-gray-600 mt-6 text-base">
          Belum punya akun admin?{' '}
          <Link to="/admin/register" className="text-blue-600 hover:text-blue-800 font-semibold transition duration-200">
            Daftar Sekarang
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

export default Login;