import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndustry, faLightbulb, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import BG9 from '../assets/images/_RRR5517.JPG';
import BG10 from '../assets/images/IMG_9653.JPG';

function Company() {
  return (
    <>
      <div
        className="relative bg-cover bg-center bg-no-repeat shadow-md rounded-xs p-4 sm:p-6 text-white overflow-hidden h-72 sm:h-96 md:h-[500px] border-b border-gray-300"
        style={{ backgroundImage: `url(${BG9})` }}
      >
        <div className="absolute inset-0 bg-black/70 z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          <h1 className="text-center text-xl md:text-2xl font-bold mb-4">Visi Kami</h1>  
          <p className="text-center text-xl md:text-4xl font-semibold max-w-md sm:max-w-2xl px-2">
            Menjadi perusahaan produsen baja ringan nomor satu di wilayah Banten dan Jabodetabek.
          </p>
        </div>
      </div>

    <div className="rounded-xs p-4 md:px-24 md:py-16 space-y-8 border-b border-gray-300">
    <h1 className="text-xl md:text-2xl font-bold text-center mb-4">Misi Kami</h1>

    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-6 sm:gap-8 items-center">
      
        <div className="bg-white p-4 rounded-xs border border-gray-200 w-full sm:w-60 md:h-[320px] text-center space-y-3 flex flex-col justify-start">
        <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto">
            <FontAwesomeIcon icon={faIndustry} size="lg" />
        </div>
        <p>
            Memproduksi baja ringan sesuai dengan spesifikasi standar yang telah ditetapkan.
        </p>
        </div>

        <div className="bg-white p-4 rounded-xs border border-gray-200 w-full sm:w-60 md:h-[320px] text-center space-y-3 flex flex-col justify-start">
        <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto">
            <FontAwesomeIcon icon={faLightbulb} size="lg" />
        </div>
        <p>
            Memberikan edukasi kepada pelanggan mengenai keunggulan baja ringan sebagai bahan yang tahan lama dan kokoh,
            serta sebagai alternatif pengganti kayu yang sebelumnya banyak digunakan oleh masyarakat.
        </p>
        </div>

        <div className="bg-white p-4 rounded-xs border border-gray-200 w-full sm:w-60 md:h-[320px] text-center space-y-3 flex flex-col justify-start">
        <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto">
            <FontAwesomeIcon icon={faThumbsUp} size="lg" />
        </div>
        <p>
            Memberikan kepuasan kepada pelanggan dengan menghadirkan baja ringan berkualitas, sehingga lebih efisien
            dalam pengeluaran biaya dan dapat memenuhi kebutuhan papan masyarakat secara optimal.
        </p>
        </div>

    </div>
    </div>

      <div className="p-4 md:px-24 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-white border-b border-gray-300">
        <div>
          <h1 className="text-xl md:text-2xl text-center md:text-left font-bold mb-4">Sejarah Perusahaan</h1>
          <p>
            PT. Berlian Baja Nusantara didirikan pada tahun 2021 dan telah beroperasi selama 4 tahun. Perusahaan ini
            berfokus pada pemenuhan kebutuhan baja ringan di wilayah Tangerang, Serang, dan Banten, mengingat masih
            terbatasnya jumlah supplier baja ringan di daerah tersebut. Kehadiran PT. Berlian Baja Nusantara
            diharapkan dapat memberikan manfaat bagi masyarakat sekitar dalam memperoleh produk baja ringan berkualitas.
          </p>
        </div>
        <div>
          <img
            src={BG10}
            alt="Foto perusahaan"
            className="rounded-xs shadow-md w-full object-cover"
          />
        </div>
      </div>
    </>
  );
}

export default Company;
