import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndustry, faLightbulb, faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import BG9 from '../assets/images/_RRR5517.JPG';
import BG10 from '../assets/images/IMG_9653.JPG';

function Company() {
  return (
    <div className="bg-white"> 
      <div
        className="relative bg-cover bg-center bg-no-repeat shadow-inner-lg overflow-hidden h-72 sm:h-96 lg:h-[550px] flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${BG9})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/60 z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center px-4 sm:px-8 md:px-16 lg:px-24">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 md:mb-6 leading-tight drop-shadow-md">
            Visi Kami
          </h1>
          <p className="text-lg sm:text-xl md:text-3xl font-semibold max-w-xl sm:max-w-3xl leading-relaxed opacity-95">
            Menjadi perusahaan produsen baja ringan nomor satu di wilayah Banten dan Jabodetabek.
          </p>
        </div>
      </div>

      <div className="py-12 md:py-20 px-4 md:px-16 bg-gray-50">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-10">Misi Kami</h2>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FontAwesomeIcon icon={faIndustry} size="2x" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Produksi Berkualitas</h3>
            <p className="text-gray-600 leading-relaxed">
              Memproduksi baja ringan sesuai dengan spesifikasi standar yang telah ditetapkan.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FontAwesomeIcon icon={faLightbulb} size="2x" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Edukasi & Inovasi</h3>
            <p className="text-gray-600 leading-relaxed">
              Memberikan edukasi kepada pelanggan mengenai keunggulan baja ringan sebagai bahan yang tahan lama dan kokoh,
              serta sebagai alternatif pengganti kayu yang sebelumnya banyak digunakan oleh masyarakat.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <FontAwesomeIcon icon={faHandsHelping} size="2x" /> 
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Kepuasan Pelanggan</h3>
            <p className="text-gray-600 leading-relaxed">
              Memberikan kepuasan kepada pelanggan dengan menghadirkan baja ringan berkualitas, sehingga lebih efisien
              dalam pengeluaran biaya dan dapat memenuhi kebutuhan papan masyarakat secara optimal.
            </p>
          </div>
        </div>
      </div>

      <div className="py-12 md:py-20 px-4 md:px-16 bg-white"> 
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1"> 
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6 text-center lg:text-left">
              Sejarah Perusahaan
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-center lg:text-left">
              PT. Berlian Baja Nusantara didirikan pada tahun 2021 dan telah beroperasi selama 4 tahun.
              Perusahaan ini berfokus pada pemenuhan kebutuhan baja ringan di wilayah Tangerang, Serang, dan Banten,
              mengingat masih terbatasnya jumlah supplier baja ringan di daerah tersebut. Kehadiran PT. Berlian Baja Nusantara
              diharapkan dapat memberikan manfaat bagi masyarakat sekitar dalam memperoleh produk baja ringan berkualitas
              tinggi dan solusi konstruksi yang efisien.
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <img
              src={BG10}
              alt="Foto Fasilitas Perusahaan Berlian Baja Nusantara"
              className="rounded-xl shadow-xl w-full h-auto object-cover transform transition-transform duration-300 ease-in-out hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Company;