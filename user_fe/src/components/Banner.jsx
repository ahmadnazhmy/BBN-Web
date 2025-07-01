import React, { useEffect, useState } from "react";
import BG1 from "../assets/images/_RRR5419.JPG";
import BG2 from "../assets/images/_RRR5503.JPG";
import BG3 from "../assets/images/_RRR5546.JPG";
import BG4 from "../assets/images/_RRR5414.JPG"; 

const banners = [
  {
    image: BG1,
    title: "Selamat Datang di Berlian Baja Nusantara",
    description: "Menyediakan berbagai macam kebutuhan baja Anda.",
  },
  {
    image: BG2,
    title: "Mengapa Produk Berlian Baja Nusantara?",
    description: "Prima Inti Truss dibuat menggunakan bahan baku yang sudah berstandar SNI.",
  },
  {
    image: BG3,
    title: "Pilihan Metode Terima Barang",
    description: "Pengantaran langsung ke lokasi Anda atau pengambilan produk di pabrik kami.",
  },
  {
    image: BG4,
    title: "Apresiasi Khusus untuk Toko Mitra Berprestasi!",
    description: "Nikmati reward eksklusif sebagai bentuk penghargaan atas pencapaian target penjualan Anda bersama Berlian Baja Nusantara.",
  },
];

export default function Banner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-96 md:h-[500px] overflow-hidden">
      {banners.map((banner, index) => (
        <div
          key={index}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-0" : "opacity-0 z-0"
          }`}
        >
          <img
            src={banner.image}
            alt={`Slide ${index + 1}: ${banner.title}`}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="absolute inset-0 flex items-center justify-center text-center z-20 px-4 md:px-24">
        <div
          key={current}
          className="text-white transition-all duration-700 ease-in-out transform"
          style={{
            opacity: 1,
            transform: 'translateY(0)',
            animation: 'fadeInUp 0.7s ease-out forwards',
          }}
        >
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight drop-shadow-lg">
            {banners[current].title}
          </h1>
          <p className="text-base md:text-xl font-medium max-w-2xl mx-auto drop-shadow-md">
            {banners[current].description}
          </p>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              current === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}