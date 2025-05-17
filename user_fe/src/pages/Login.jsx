import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import CryptoJS from 'crypto-js';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const secretKey = 'your_super_secret_key_32char'; 

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/\S+@\S+\.\S+/.test(email)) {
      alert('Email tidak valid!');
      return;
    }
    if (password.length < 6) {
      alert('Password harus memiliki setidaknya 6 karakter');
      return;
    }

    setLoading(true);

    try {
      const encrypted = encryptData({ email, password });

      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encrypted }),
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user_id', result.user_id);

        navigate('/');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error saat login:', error);
      alert('Terjadi kesalahan saat login. Silakan coba lagi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center md:min-h-screen bg-gray-100">
      <div className="max-w-sm w-full py-12 px-6 md:rounded-xs md:shadow-lg md:bg-white">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email"
              className="bg-white w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
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
              aria-label="Password"
              className="bg-white w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-800 text-white rounded-xs hover:bg-blue-900 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
