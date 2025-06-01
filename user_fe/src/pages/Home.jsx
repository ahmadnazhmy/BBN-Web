import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Banner from '../components/Banner';
import Product from '../components/Product';
import Promotion from '../components/Promotion';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';
import Company from '../components/Company';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

function Home() {
  const [unpaidCount, setUnpaidCount] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUnpaid = async () => {
      if (!token) return;

      try {
        const res = await fetch('https://bbn-web-production.up.railway.app/api/unpaid-count', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok && data.count) {
          setUnpaidCount(data.count);
        }
      } catch (err) {
        console.error('Gagal memuat data belum dibayar:', err); 
      }
    };

    fetchUnpaid();
  }, [token]);

  return (
    <div>
      <Nav />
      {token && unpaidCount > 0 && (
        <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 md:p-4 shadow-lg z-10 animate-slide-down">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-5">
            <div className="flex items-center text-center md:text-left w-full md:w-auto justify-center md:justify-start">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-xl md:text-3xl mr-2 md:mr-3 flex-shrink-0" />
              <p className="font-bold text-base md:text-xl leading-tight">
                Anda memiliki <span className="text-red-800 drop-shadow-sm">{unpaidCount}</span> pesanan yang perlu diselesaikan!
              </p>
            </div>

            <button
              onClick={() => navigate('/history')}
              className="w-full md:w-auto bg-white text-yellow-700 font-semibold px-4 py-2 md:px-6 md:py-2.5 rounded-full shadow-md hover:bg-gray-100 hover:text-yellow-800 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 text-sm md:text-base"
            >
              Lihat & Bayar Sekarang
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-gray-300">
        <Banner />
      </div>

      <div className="border-b border-gray-300">
        <Product />
      </div>

      <div className="border-b border-gray-300">
        <Promotion />
      </div>

      <div className="border-b border-gray-300">
        <Company />
      </div>

      <div className="border-b border-gray-300">
        <Gallery />
      </div>

      <div>
        <Contact />
      </div>

      <Footer />

      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slideDown 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Home;