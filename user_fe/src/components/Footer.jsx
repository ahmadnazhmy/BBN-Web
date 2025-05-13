import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp, faInstagram } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/images/logo.png';

function Footer() {
  return (
    <footer className="py-8 px-4 md:px-24">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-4 md:mb-8">
        <div className="flex flex-col items-start">
          <img src={logo} alt="Company Logo" className="w-24 mb-3" />
          <p>"Baja Ringan Prima Inti Truss – Kualitas You Can Trust.
          "</p>
        </div>
        
        <div>
          <h4 className="text-xl font-bold mb-2">Alamat</h4>
          <p>Kws Industri Pergudangan Blessindo 2, Jl. Raya H. Tabri No.228 Blok P11, Kp.Nagrek, Bojongkamal, Kec. Legok, Kabupaten Tangerang, Banten 15820</p>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-2">Jam operasional</h4>
          <p>Senin - Jumat: 08.00 - 17.00</p>
          <p>Sabtu: 08.00 - 14.00</p>
          <p>Minggu: Libur</p>
        </div>
        <div className="flex flex-col">
          <h4 className="text-xl font-bold mb-2">Media sosial</h4>
          <div className="flex flex-col gap-2">
              <a href="https://wa.me/0813-8999-5199" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-900">
                <FontAwesomeIcon icon={faWhatsapp} className="text-2xl mr-2" />0813-8999-5199
              </a>
              <a href="https://www.instagram.com/berlianbajanusantara/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-900">
                <FontAwesomeIcon icon={faInstagram} className="text-2xl mr-2" />@berlianbajanusantara
              </a>
          </div>
        </div>
      </div>

       <div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7932.161035749138!2d106.557225!3d-6.3242913!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69e34c568da5d5%3A0x342d2c8f7f1daeb1!2sPT.%20BERLIAN%20BAJA%20NUSANTARA!5e0!3m2!1sen!2sid!4v1707468298376!5m2!1sen!2sid"
            className='rounded-xs'  
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy">
          </iframe>
        </div>
      
      <div className="text-center text-xs text-gray-400 mt-4">
        <p>© 2025 PT. Berlian Baja Nusantara. All Rights Reserved.</p>
        <p><a href="/privacy-policy" className="hover:underline">Kebijakan Privasi</a></p>
      </div>
    </footer>
  );
}

export default Footer;