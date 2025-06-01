import React from 'react';
import BG9 from "../assets/images/IMG_9760.JPG";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons';

function Contact() {
  return (
    <div className='md:px-24 md:py-16 bg-gray-50'>
      <div
        className="relative bg-cover bg-center md:h-96 flex items-center justify-start md:rounded-lg overflow-hidden shadow-xl"
        style={{ backgroundImage: `url(${BG9})` }}
      >
        <div className="absolute inset-0 bg-black/65"></div>
        <div className="relative w-full md:w-2/3 lg:w-1/2 p-6 md:p-12 text-left text-white space-y-5">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            Punya Pertanyaan? <br /> Yuk, Ngobrol dengan Kami!
          </h2>
          <p className="text-base md:text-lg text-gray-200">
            Tim kami siap membantu Anda dengan informasi produk, pemesanan, atau pertanyaan lainnya.
            Hubungi kami melalui:
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <a
              href="https://wa.me/0813-8999-5199"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 transition-colors duration-200 ease-in-out transform hover:scale-105"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="mr-2 text-xl" /> WhatsApp
            </a>
            <a
              href="https://www.instagram.com/direct/t/17848453889504687"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200 ease-in-out transform hover:scale-105"
            >
              <FontAwesomeIcon icon={faInstagram} className="mr-2 text-xl" /> Instagram DM
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;