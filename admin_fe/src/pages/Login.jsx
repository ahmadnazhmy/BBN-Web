import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom'; 

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
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
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('Error during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-sm w-full py-12 px-6 rounded-xs shadow-lg bg-white">
        <h2 className="text-2xl font-bold text-center mb-6">Login Admin</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="mb-6 relative">
            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-800 text-white rounded-xs hover:bg-blue-900 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="text-center mt-4">
          Belum punya akun?{' '}
          <Link to="/admin/register" className="text-blue-600 hover:text-blue-800">
            Klik daftar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
