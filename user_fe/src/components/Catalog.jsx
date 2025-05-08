import React, { useState } from 'react';
import KanalC from '../assets/images/1.png';
import Reng from '../assets/images/2.png';
import SpandekPolos from '../assets/images/3.png';
import Bondek from '../assets/images/4.png';
import Hollow from '../assets/images/5.png';
import TalangJuray from '../assets/images/6.png';
import GentengPasir from '../assets/images/7.png'
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
  
  Kanal C kami siap memenuhi kebutuhan proyek Anda, baik skala kecil maupun besar.`
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
  • Distributor & toko bahan bangunan`
    },
    {
      id: 3,
      name: 'Spandek',
      image: SpandekPolos,
      description: `Spandek Prima Inti Truss — kuat, ringan, dan tahan lama.
  
  • Desain bergelombang khas, efektif mengalirkan air
  • Anti karat dengan lapisan pelindung
  • Reduksi suara hujan berkat motif gunung
  
  Pilihan tepat untuk atap bangunan yang tahan cuaca dan estetik.`
    },
    {
      id: 4,
      name: 'Bondek',
      image: Bondek,
      description: `Bondek/Floordeck Prima Inti Truss memberikan solusi terbaik untuk plat lantai beton yang kokoh.
  
  • Ketebalan mulai dari 0.55 MM hingga 0.75 MM
  • Tersedia dalam tiga jenis: Galvanize, Blackresin, Galvalume
  • Cocok untuk aplikasi proyek rumah hingga gedung bertingkat
  
  Dapatkan kekuatan dan efisiensi dalam satu produk.`
    },
    {
      id: 5,
      name: 'Hollow',
      image: Hollow,
      description: `Hollow Prima Inti Truss dirancang untuk kekuatan dan kemudahan instalasi.
  
  • Anti karat & korosi – ideal untuk area terbuka/lembap
  • Bentuk presisi memudahkan pemasangan
  • Ramah lingkungan – bisa didaur ulang
  
  Solusi struktural ringan dan andal untuk berbagai kebutuhan.`
    },
    {
      id: 6,
      name: 'Talang Jurai',
      image: TalangJuray,
      description: `Talang Jurai Prima Inti Truss untuk pengaliran air hujan yang efisien.
  
  • Type: Polos
  • Panjang: 3 Meter
  • Material: Baja ringan anti karat
  • Dirancang untuk atap model jurai
  
  Lindungi struktur bangunan Anda dari kebocoran dan kerusakan.`
    },
    {
      id: 7,
      name: 'Genteng Pasir',
      image: GentengPasir,
      description: `Genteng Pasir Prima Inti Truss menghadirkan tampilan premium dan perlindungan tahan cuaca.
  
  • Estetika elegan dengan permukaan bertekstur pasir
  • Warna tahan lama dan anti pudar
  • Cocok untuk hunian modern & tradisional
  
  Solusi atap kuat, tahan lama, dan menawan.`
    }
  ];
  

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  return (
    <div>
      <div className="flex flex-nowrap overflow-x-auto space-x-4">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="flex-shrink-0 bg-white border border-gray-300 rounded shadow-md cursor-pointer transform transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            style={{ width: '180px' }}
          >
            <div className="flex items-center justify-center overflow-hidden rounded-t h-40">
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-2 text-center">
              <p className="text-sm md:text-base">{product.name}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0  backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-4xl w-full relative flex flex-col md:flex-row">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              <FontAwesomeIcon icon={faXmark} size="xl" className='p-4'/>
            </button>

            <div className="w-full md:w-1/2 mb-4 md:mb-0 flex items-center">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full aspect-square object-cover rounded-xs "
              />
            </div>

            <div className="w-full md:w-1/2 md:pl-6 flex flex-col p-8">
              <h2 className="text-2xl font-semibold mb-4">{selectedProduct.name}</h2>
              <div className="text-gray-600 whitespace-pre-line">
                {selectedProduct.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}

export default Catalog;
