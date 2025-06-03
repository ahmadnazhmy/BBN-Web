import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faMapMarkerAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/images/logo.png';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 py-12 px-4 md:px-8 lg:px-24">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

        <div className="flex flex-col items-start lg:col-span-1">
          <img src={logo} alt="Company Logo - Berlian Baja Nusantara" className="w-32 mb-4" />
          <p className="text-base leading-relaxed">
            "Baja Ringan Prima Inti Truss – Kualitas You Can Trust."
          </p>
        </div>

        <div className="lg:col-span-1">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-blue-400" />
            Alamat
          </h4>
          <p className="text-base leading-relaxed">
            Kws Industri Pergudangan Blessindo 2, Jl. Raya H. Tabri No.228 Blok P11, Kp.Nagrek, Bojongkamal, Kec. Legok, Kabupaten Tangerang, Banten 15820
          </p>
        </div>

        <div className="lg:col-span-1">
          <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FontAwesomeIcon icon={faClock} className="mr-3 text-green-400" />
            Jam Operasional
          </h4>
          <p className="text-base">Senin - Jumat: <span className="font-medium">08.00 - 17.00</span></p>
          <p className="text-base">Sabtu: <span className="font-medium">08.00 - 14.00</span></p>
          <p className="text-base">Minggu: <span className="font-medium">Libur</span></p>
        </div>

        <div className="flex flex-col lg:col-span-1">
          <h4 className="text-xl font-semibold text-white mb-4">Media Sosial</h4>
          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/0821-1231-4463"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-300 hover:text-green-500 transition-colors duration-200 text-lg"
              aria-label="Chat with us on WhatsApp"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="text-3xl mr-3" />
              0821-1231-4463
            </a>
            <a
              href="https://www.instagram.com/berlianbajanusantara/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-gray-300 hover:text-pink-500 transition-colors duration-200 text-lg"
              aria-label="Follow us on Instagram"
            >
              <FontAwesomeIcon icon={faInstagram} className="text-3xl mr-3" />
              @berlianbajanusantara
            </a>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.196929944743!2d106.5298910750796!3d-6.39498266255152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69fb21932f913d%3A0x6335a9d2d091e488!2sKws%20Industri%20Pergudangan%20Blessindo%202!5e0!3m2!1sen!2sid!4v1717149942767!5m2!1sen!2sid"
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Lokasi PT. Berlian Baja Nusantara di Google Maps"
          className="rounded-lg shadow-xl"
        ></iframe>
      </div>

      <div className="text-center text-sm border-t border-gray-700 pt-6"> 
        <p className="text-gray-400 mb-1">
          &copy; {currentYear} PT. Berlian Baja Nusantara. All Rights Reserved.
        </p>
        <p>
          <a href="/privacy-policy" className="text-gray-400 hover:text-blue-400 hover:underline transition-colors duration-200">
            Kebijakan Privasi
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;