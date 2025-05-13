import React, { useEffect, useState } from "react";
import BG1 from "../assets/images/_RRR5419.JPG";
import BG2 from "../assets/images/_RRR5503.JPG";
import BG3 from "../assets/images/_RRR5546.JPG";

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
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={banner.image}
            alt={`Slide ${index}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/70 z-10" />
      <div className="absolute inset-0 flex items-center justify-center text-center z-20 px-4 md:px-24">
        <div className="text-white transition-all duration-500">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">
            {banners[current].title}
          </h1>
          <p>{banners[current].description}</p>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-1 h-1 rounded-full transition ${
              current === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
