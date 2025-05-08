import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBox,
  faClipboardList,
  faMoneyCheckAlt,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import Logo from '../assets/images/logo.png';

function Side() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/user', label: 'Pelanggan', icon: faUsers },
    { path: '/product', label: 'Produk', icon: faBox },
    { path: '/order', label: 'Pesanan', icon: faClipboardList },
    { path: '/payment', label: 'Pembayaran', icon: faMoneyCheckAlt },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  return (
    <div className="w-80 h-screen bg-blue-900 text-white flex flex-col p-6 shadow-lg">
      <div className="flex items-center justify-center mb-8">
        <img src={Logo} alt="Logo" className="w-20" />
      </div>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 rounded-lg transition-all ${
              location.pathname === item.path
                ? 'bg-blue-950 font-semibold'
                : 'hover:bg-blue-950'
            }`}
          >
          <div className='w-8 h-8 flex items-center'>
          <FontAwesomeIcon icon={item.icon} />
          </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
      >
        <div className='w-8 h-8 flex items-center'>
        <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
        </div>
        <span>Logout</span>
      </button>
    </div>
  );
}

export default Side;
