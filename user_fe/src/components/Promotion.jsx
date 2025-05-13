import React from 'react';
import BG4 from "../assets/images/baja ringan.jpg";
import BG5 from "../assets/images/_RRR5400.JPG";

function Promotion() {
  return (
    <div className="bg-white p-4 md:px-24 md:py-16 space-y-8 md:space-y-0">
      <div className="flex flex-col md:flex-row h-auto md:h-80">
        <div
          className="relative w-full md:w-1/2 h-64 md:h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${BG5})` }}
        >
          <div className="absolute inset-0 bg-black opacity-20"></div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-12 pt-4 md:pt-0">
          <p className="text-xl md:text-2xl font-bold mb-4">Keunggulan Prima Inti Truss:</p>
          <ul className="space-y-2">
            <li>✔️ Kekuatan struktural tinggi</li>
            <li>✔️ Tahan karat & cuaca ekstrem</li>
            <li>✔️ Presisi & efisiensi pemasangan</li>
            <li>✔️ Estetika atap modern</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row-reverse h-auto md:h-80">
        <div
          className="relative w-full md:w-1/2 h-64 md:h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${BG4})` }}
        >
          <div className="absolute inset-0 bg-black opacity-20"></div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-12 pt-4 md:pt-0">
          <p className="text-xl md:text-2xl font-bold mb-4">
            Baja ringan bermutu tinggi & kualitas terjamin
          </p>
          <p>
            Solusi penutup atap yang kuat, tahan lama, dan presisi. Kualitas tepercaya untuk investasi jangka panjang Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Promotion;
