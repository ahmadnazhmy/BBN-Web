import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faBox, faClipboardList, faMoneyCheckAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import Logo from '../assets/images/logo.png';

function Side({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: faChartLine },
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
    <div
      className={`fixed top-0 left-0 h-screen bg-blue-900 text-white flex flex-col p-6 shadow-lg z-20 transition-all duration-300 ease-in-out
        ${isOpen ? 'w-80' : 'w-24'} `}
    >
      <div className="flex items-center justify-center mb-8">
        {isOpen && (
          <img src={Logo} alt="Logo" className="w-20 transition-all duration-300" />
        )}
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-2 rounded-lg transition-all
              ${location.pathname === item.path ? 'bg-blue-950 font-semibold' : 'hover:bg-blue-950'}
              ${!isOpen ? 'justify-center' : ''}
            `}
          >
            <div className="w-8 h-8 flex justify-center items-center flex-shrink-0">
              <FontAwesomeIcon icon={item.icon} className="text-lg" />
            </div>
            <span className={`${isOpen ? 'block ml-2' : 'hidden'} origin-left whitespace-nowrap overflow-hidden`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className={`mt-auto flex items-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors
          ${!isOpen ? 'justify-center' : ''}
        `}
      >
        <div className="w-8 h-8 flex justify-center items-center flex-shrink-0">
          <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
        </div>
        <span className={`${isOpen ? 'block ml-2' : 'hidden'} origin-left whitespace-nowrap overflow-hidden`}>Logout</span>
      </button>
    </div>
  );
}

export default Side;