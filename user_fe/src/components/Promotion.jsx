import React from 'react';
import BG4 from "../assets/images/baja ringan.jpg";
import BG5 from "../assets/images/_RRR5400.JPG";

function Promotion() {
  return (
    <div className="bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="relative flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden">
          <div
            className="relative w-full md:w-1/2 h-64 md:h-96 bg-cover bg-center"
            style={{ backgroundImage: `url(${BG5})` }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          <div className="relative w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
            <div className="relative z-10 text-gray-800">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight">Keunggulan Prima Inti Truss:</h2>
              <ul className="space-y-3 text-lg">
                <li><span className="text-blue-600 font-semibold">✔️ Kekuatan struktural tinggi</span> – Kokoh dan andal untuk setiap proyek.</li>
                <li><span className="text-blue-600 font-semibold">✔️ Tahan karat & cuaca ekstrem</span> – Dirancang untuk iklim tropis Indonesia.</li>
                <li><span className="text-blue-600 font-semibold">✔️ Presisi & efisiensi pemasangan</span> – Mempercepat waktu konstruksi Anda.</li>
                <li><span className="text-blue-600 font-semibold">✔️ Estetika atap modern</span> – Tampilan yang bersih dan stylish.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col md:flex-row-reverse bg-white rounded-xl shadow-lg overflow-hidden">
          <div
            className="relative w-full md:w-1/2 h-64 md:h-96 bg-cover bg-center"
            style={{ backgroundImage: `url(${BG4})` }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          <div className="relative w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
            <div className="relative z-10 text-gray-800">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight">
                Baja Ringan Bermutu Tinggi & Kualitas Terjamin
              </h2>
              <p className="text-lg leading-relaxed">
                Kami menyediakan solusi penutup atap yang kuat, tahan lama, dan presisi. Setiap produk Prima Inti Truss adalah jaminan kualitas terpercaya untuk investasi jangka panjang properti Anda di Bekasi dan sekitarnya.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Promotion;