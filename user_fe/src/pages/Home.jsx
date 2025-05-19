import React from 'react'
import Nav from '../components/Nav'
import Banner from '../components/Banner'
import Product from '../components/Product'
import Promotion from '../components/Promotion'
import Footer from '../components/Footer'
import Gallery from '../components/Gallery'
import Contact from '../components/Contact'
import Company from '../components/Company'

function Home() {
  return (
    <div>
      <Nav />

      <div className="border-b border-gray-300">
        <Banner />
      </div>

      <div className="border-b border-gray-300">
        <Product />
      </div>

      <div className="border-b border-gray-300">
        <Promotion />
      </div>

      <div className="border-b border-gray-300">
        <Company/>
      </div>

      <div className="border-b border-gray-300">
        <Gallery />
      </div>

      <div className="border-b border-gray-300">
        <Contact />
      </div>

      <Footer />
    </div>
  )
}

export default Home
