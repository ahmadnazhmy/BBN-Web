import React from 'react';
import BG6 from "../assets/images/_RRR5401.JPG";
import BG7 from "../assets/images/_RRR5540.JPG";
import BG8 from "../assets/images/_RRR5528.JPG";

function Gallery() {
  const images = [
    {
      src: BG6,
      alt: 'Lembaran baja presisi tinggi',
      title: 'Presisi Baja Berkualitas Tinggi',
      description: 'Lembaran baja presisi tinggi untuk struktur kokoh dan tahan lama, diproduksi dengan standar ketat.',
    },
    {
      src: BG7,
      alt: 'Spandek untuk atap dan dinding',
      title: 'Produksi Spandek Unggulan', 
      description: 'Spandek kami memiliki bentuk dan kekuatan optimal, ideal untuk atap dan dinding yang estetis dan fungsional.',
    },
    {
      src: BG8,
      alt: 'Pengangkutan coil aman',
      title: 'Penanganan Material Profesional', 
      description: 'Proses pengangkutan coil baja dilakukan dengan aman dan efisien oleh operator berpengalaman kami.',
    },
  ];

  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-center text-4xl font-extrabold text-gray-900 mb-12 leading-tight tracking-tight">
          Galeri Produksi Kami
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((image, index) => (
            <div
              key={index}
              className="bg-white shadow-xl rounded-lg overflow-hidden transform transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl group" 
            >
              <div className="relative overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-64 object-cover object-center transform transition-transform duration-500 ease-in-out group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div> 
              </div>
              <div className="p-6"> 
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {image.title}
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  {image.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Gallery;