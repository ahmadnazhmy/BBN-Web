import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../assets/images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faBell, faUser, faRightFromBracket, faCartShopping, faBars, faTimes, faHome } from '@fortawesome/free-solid-svg-icons';
import Notification from '../pages/Notification';

export default function Nav() {
  const isLoggedIn = localStorage.getItem('token') !== null;
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const notificationButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutsideNotif(event) {
      if (
        notifDropdownRef.current && !notifDropdownRef.current.contains(event.target) &&
        notificationButtonRef.current && !notificationButtonRef.current.contains(event.target)
      ) {
        setIsNotifOpen(false);
      }
    }

    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutsideNotif);
    } else {
      document.removeEventListener('mousedown', handleClickOutsideNotif);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideNotif);
    };
  }, [isNotifOpen]);

  useEffect(() => {
    function handleClickOutsideMobileMenu(event) {
      if (
        mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.mobile-menu-toggle') 
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideMobileMenu);
      document.body.style.overflow = 'hidden'; 
    } else {
      document.removeEventListener('mousedown', handleClickOutsideMobileMenu);
      document.body.style.overflow = 'unset'; 
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMobileMenu);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (isLoggedIn) {
        const userId = localStorage.getItem('user_id'); 
        if (userId) {
          try {
            const response = await fetch('https://bbn-web-production.up.railway.app/api/notification/count', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setNotificationCount(data.count);
          } catch (error) {
            console.error('Error fetching notification count:', error);
            setNotificationCount(0);
          }
        } else {
            setNotificationCount(0);
        }
      } else {
        setNotificationCount(0);
      }
    };

    fetchNotificationCount();
  }, [isLoggedIn]);

  const isActiveLink = (path) =>
    location.pathname === path ? 'font-bold text-blue-700' : 'text-gray-600';

  const navItemBaseClass =
    'flex items-center gap-2 p-2 rounded-md transition duration-300';

  const navItemClass = (path) =>
    `${navItemBaseClass} hover:text-blue-700 hover:bg-gray-100 ${isActiveLink(path)}`;

  const iconClass = (path) =>
    `text-lg transition duration-300 ${isActiveLink(path)}`;

  return (
    <nav className="sticky top-0 bg-white shadow-md z-50">
      <div className="py-4 px-6 md:px-12 lg:px-24">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img src={Logo} alt="Berlian Baja Nusantara Logo" className="w-10 h-10 mr-2 object-contain" />
            <h1 className="hidden md:block text-xl font-bold text-gray-800 tracking-tight">
              Berlian Baja Nusantara
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-base">
            {isLoggedIn ? (
              <>
                <Link to="/cart" className={navItemClass('/cart')}>
                  <FontAwesomeIcon icon={faCartShopping} className={iconClass('/cart')} />
                  <span className="hidden lg:block">Keranjang</span>
                </Link>
                <Link to="/history" className={navItemClass('/history')}>
                  <FontAwesomeIcon icon={faHistory} className={iconClass('/history')} />
                  <span className="hidden lg:block">Riwayat</span>
                </Link>

                <div className="relative">
                  <button
                    ref={notificationButtonRef} 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative flex items-center gap-2 p-2 rounded-md transition duration-300 hover:text-blue-700 hover:bg-gray-100 focus:outline-none"
                    aria-label="Notifikasi"
                  >
                    <FontAwesomeIcon icon={faBell} className="text-lg text-gray-600 group-hover:text-blue-700" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                    <span className="hidden lg:block">Notifikasi</span>
                  </button>
                  <Notification
                    isOpen={isNotifOpen}
                    setIsOpen={setIsNotifOpen}
                    notificationButtonRef={notificationButtonRef}
                    setParentNotificationCount={setNotificationCount}
                  />
                </div>

                <Link to="/editprofile" className={navItemClass('/editprofile')}>
                  <FontAwesomeIcon icon={faUser} className={iconClass('/editprofile')} />
                  <span className="hidden lg:block">Profil</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-red-600 border border-red-600 hover:bg-red-50 hover:text-red-700 transition duration-300 text-base"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="text-lg" />
                  <span className="hidden lg:block">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex gap-4 items-center">
                <Link to="/register" className="text-base text-gray-600 hover:text-blue-700 transition duration-200">
                  Daftar
                </Link>
                <Link to="/login">
                  <button className="bg-blue-700 hover:bg-blue-800 transition duration-200 text-white px-5 py-2 rounded-md shadow-sm text-base">
                    Login
                  </button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            {isLoggedIn && (
              <Link to="/cart" className="text-xl text-gray-600 hover:text-blue-700 transition-colors" aria-label="Keranjang Belanja">
                <FontAwesomeIcon icon={faCartShopping} />
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-toggle text-gray-700 hover:text-blue-700 text-2xl transition-colors duration-200 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 w-64 max-w-xs h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden z-50
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Menu Navigasi</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-600 hover:text-red-600 text-2xl focus:outline-none"
              aria-label="Close mobile menu"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <Link to="/" className={navItemClass('/')} onClick={() => setIsMobileMenuOpen(false)}>
            <FontAwesomeIcon icon={faHome} /> Beranda
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/cart" className={navItemClass('/cart')} onClick={() => setIsMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faCartShopping} /> Keranjang
              </Link>
              <Link to="/history" className={navItemClass('/history')} onClick={() => setIsMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faHistory} /> Riwayat Pesanan
              </Link>
              <div className="relative w-full">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                  }}
                  className="flex items-center gap-2 p-2 w-full text-left rounded-md transition duration-300 hover:text-blue-700 hover:bg-gray-100 text-gray-600 focus:outline-none"
                  aria-label="Notifikasi"
                >
                  <FontAwesomeIcon icon={faBell} /> Notifikasi
                  {notificationCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </div>
              <Link to="/editprofile" className={navItemClass('/editprofile')} onClick={() => setIsMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faUser} /> Profil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 p-2 w-full text-left rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-300"
              >
                <FontAwesomeIcon icon={faRightFromBracket} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className={navItemClass('/register')} onClick={() => setIsMobileMenuOpen(false)}>
                Daftar
              </Link>
              <Link to="/login" className="block mt-4">
                <button className="bg-blue-700 hover:bg-blue-800 transition duration-200 text-white px-5 py-2 w-full rounded-md shadow-sm">
                  Login
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      <style>
        {`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        `}
      </style>
    </nav>
  );
}