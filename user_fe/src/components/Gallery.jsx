import React from 'react';
import BG6 from "../assets/images/_RRR5401.JPG";
import BG7 from "../assets/images/_RRR5540.JPG";
import BG8 from "../assets/images/_RRR5528.JPG";

function Gallery() {
  const images = [
    {
      src: BG6,
      alt: 'Foto 1',
      description: 'Lembaran baja presisi tinggi untuk struktur kokoh dan tahan lama.',
    },
    {
      src: BG7,
      alt: 'Foto 2',
      description: 'Spandek dengan bentuk dan kekuatan optimal untuk atap dan dinding.',
    },
    {
      src: BG8,
      alt: 'Foto 3',
      description: 'Pengangkutan coil aman oleh operator berpengalaman.',
    },
  ];

  return (
    <div className="p-4 md:px-24 md:py-16">
      <h1 className="text-center text-xl md:text-2xl font-bold mb-4">
        Galeri Produksi
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
        {images.map((image, index) => (
          <div key={index} className="bg-white shadow-md rounded-xs border border-gray-300 overflow-hidden">
            <img 
              src={image.src} 
              alt={image.alt} 
              className="w-full h-auto rounded-xs transform transition-transform duration-300 hover:scale-105"  
            />
            <p className="p-4 text-center text-gray-700">
              {image.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Gallery;
