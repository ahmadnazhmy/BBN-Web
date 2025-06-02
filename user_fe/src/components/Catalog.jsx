import React, { useState } from 'react';
import KanalC from '../assets/images/1.png';
import Reng from '../assets/images/2.png';
import SpandekPolos from '../assets/images/3.png';
import Bondek from '../assets/images/4.png';
import Hollow from '../assets/images/5.png';
import TalangJuray from '../assets/images/6.png';
import GentengPasir from '../assets/images/7.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

function Catalog() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = [
    {
      id: 1,
      name: 'Kanal C',
      image: KanalC,
      description: `Kanal C Prima Inti Truss hadir sebagai solusi rangka bangunan yang kuat dan presisi.
• Tersedia dalam berbagai ukuran dan ketebalan
• Ketebalan mulai dari 0.45 MM hingga 1.00 MM
• Cocok untuk proyek konstruksi ringan hingga berat

Kanal C kami siap memenuhi kebutuhan proyek Anda, baik skala kecil maupun besar.`,
    },
    {
      id: 2,
      name: 'Reng',
      image: Reng,
      description: `Reng Prima Inti Truss, pilihan terbaik untuk rangka atap yang presisi dan tahan lama.
• Tersedia dalam dua varian: R30 & R28
• Ketebalan mulai dari 0.30 MM hingga 0.45 MM
• Material berkualitas dengan standar industri

Ideal untuk:
• Rangka atap rumah & gedung
• Proyek skala kecil hingga besar
• Distributor & toko bahan bangunan`,
    },
    {
      id: 3,
      name: 'Spandek',
      image: SpandekPolos,
      description: `Spandek Prima Inti Truss — kuat, ringan, dan tahan lama.
• Desain bergelombang khas, efektif mengalirkan air
• Anti karat dengan lapisan pelindung
• Reduksi suara hujan berkat motif gunung

Pilihan tepat untuk atap bangunan yang tahan cuaca dan estetik.`,
    },
    {
      id: 4,
      name: 'Bondek',
      image: Bondek,
      description: `Bondek/Floordeck Prima Inti Truss memberikan solusi terbaik untuk plat lantai beton yang kokoh.
• Ketebalan mulai dari 0.55 MM hingga 0.75 MM
• Tersedia dalam tiga jenis: Galvanize, Blackresin, Galvalume
• Cocok untuk aplikasi proyek rumah hingga gedung bertingkat

Dapatkan kekuatan dan efisiensi dalam satu produk.`,
    },
    {
      id: 5,
      name: 'Hollow',
      image: Hollow,
      description: `Hollow Prima Inti Truss dirancang untuk kekuatan dan kemudahan instalasi.
• Anti karat & korosi – ideal untuk area terbuka/lembap
• Bentuk presisi memudahkan pemasangan
• Ramah lingkungan – bisa didaur ulang

Solusi struktural ringan dan andal untuk berbagai kebutuhan.`,
    },
    {
      id: 6,
      name: 'Talang Jurai',
      image: TalangJuray,
      description: `Talang Jurai Prima Inti Truss untuk pengaliran air hujan yang efisien.
• Tipe: Polos
• Panjang: 3 Meter
• Material: Baja ringan anti karat
• Dirancang untuk atap model jurai

Lindungi struktur bangunan Anda dari kebocoran dan kerusakan.`,
    },
    {
      id: 7,
      name: 'Genteng Pasir',
      image: GentengPasir,
      description: `Genteng Pasir Prima Inti Truss menghadirkan tampilan premium dan perlindungan tahan cuaca.
• Estetika elegan dengan permukaan bertekstur pasir
• Warna tahan lama dan anti pudar
• Cocok untuk hunian modern & tradisional

Solusi atap kuat, tahan lama, dan menawan.`,
    },
  ];

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="py-4">
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex flex-nowrap md:grid md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-7 gap-4 sm:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="flex-shrink-0 w-40 sm:w-48 md:w-auto group bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer overflow-hidden transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300 ease-in-out"
                />
              </div>
              <div className="p-3 text-center">
                <p className="text-base font-medium text-gray-800 group-hover:text-blue-700 transition-colors duration-200">
                  {product.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative transform scale-95 opacity-0 animate-scale-in">

            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors duration-200 z-10 p-2 rounded-full bg-white bg-opacity-70 hover:bg-opacity-100"
              onClick={closeModal}
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl md:text-2xl" />
            </button>

            <div className="w-full md:w-1/2 flex-shrink-0 relative overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {selectedProduct.name}
              </h2>
              <div className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-line flex-grow">
                {selectedProduct.description}
              </div>
              <button
                onClick={closeModal}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 ease-in-out self-start md:self-end"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        /* Custom scrollbar hide for better aesthetics */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}

export default Catalog;