import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../assets/images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faBell, faUser, faRightFromBracket, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import Notification from '../pages/Notification';

export default function Nav() {
  const isLoggedIn = localStorage.getItem('token') !== null;
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const location = useLocation(); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const userId = JSON.parse(localStorage.getItem('user'))?.user_id;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  const isActiveLink = (path) =>
    location.pathname === path ? 'text-black' : 'text-gray-500';

  const navItemClass = (path) =>
    `text-center text-base transition duration-200 hover:text-black ${isActiveLink(path)}`;

  return (
    <div className="py-4 px-6 md:px-24 border-b border-gray-300 z-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="Logo" className="w-10 mr-2" />
            <h1 className="hidden lg:block text-base font-bold">Berlian Baja Nusantara</h1>
          </Link>
          <Link
            to="/company"
            className="text-base text-gray-500 hover:text-black transition duration-200"
          >
            Tentang Kami
          </Link>
        </div>

        <div className="flex items-center justify-end">
          {isLoggedIn ? (
            <div className="flex gap-8 text-lg">
              <Link to="/cart" className={navItemClass('/cart')}>
                <FontAwesomeIcon icon={faCartShopping} />
              </Link>
              <Link to="/history" className={navItemClass('/history')}>
                <FontAwesomeIcon icon={faHistory} />
              </Link>

              <div
                ref={dropdownRef}
                className="relative text-center text-base text-gray-500 hover:text-black transition duration-200"
              >
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative">
                  <FontAwesomeIcon icon={faBell} />
                </button>
                <Notification isOpen={isNotifOpen} setIsOpen={setIsNotifOpen} />
              </div>

              <Link to="/editprofile" className={navItemClass('/editprofile')}>
                <FontAwesomeIcon icon={faUser} />
              </Link>
              <button
                onClick={handleLogout}
                className="text-base text-gray-500 hover:text-black transition duration-200"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
              </button>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <Link to="/register" className="text-base text-gray-500 hover:text-black transition duration-200">
                Daftar
              </Link>
              <Link to="/login">
                <button className="bg-blue-800 hover:bg-blue-900 transition duration-200 text-white px-4 py-1 rounded-xs">
                  Login
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
