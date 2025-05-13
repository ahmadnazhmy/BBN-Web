import React from 'react'
import BG9 from "../assets/images/IMG_9760.JPG"

function Contact() {
  return (
    <div className='p-0 md:px-24 md:py-16 bg-white'>
        <div
        className="relative bg-cover bg-center h-64 md:h-80 flex items-center justify-start rounded-xs overflow-hidden"
        style={{ backgroundImage: `url(${BG9})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative w-full md:w-1/2 p-4 md:p-12 text-left text-white space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ingin info lebih lanjut?
          </h2>
          <p>
            Hubungi admin kami melalui WhatsApp atau DM Instagram.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Contact
