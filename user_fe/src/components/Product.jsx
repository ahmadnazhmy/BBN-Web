import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import Catalog from './Catalog'

const Product = () => {
  const [productName, setProductName] = useState('')
  const [products, setProducts] = useState([])
  const [quantities, setQuantities] = useState({})
  const isLoggedIn = !!localStorage.getItem('token')

  async function fetchProducts() {
  try {
    let url = 'http://localhost:5000/api/product'
    if (productName) {
      const params = new URLSearchParams()
      params.append('product_name', productName)
      url += `?${params.toString()}`
    }

    const res = await fetch(url)
    const data = await res.json()
    setProducts(data)
    const initQty = {}
    data.forEach(p => { initQty[p.product_id] = 1 })
    setQuantities(initQty)
  } catch (err) {
    console.error('Gagal fetch produk:', err)
  }
}

  useEffect(() => {
    fetchProducts()
  }, [productName])

  const inc = id => setQuantities(q => ({ ...q, [id]: q[id] + 1 }))
  const dec = id => setQuantities(q => ({ ...q, [id]: Math.max(q[id] - 1, 1) }))

  const handleAddToCart = async p => {
    const qty = quantities[p.product_id]
    if (p.stock < qty) {
      return alert(`Stok tidak cukup! (${p.stock} tersisa)`)
    }
    try {
      await axios.post('http://localhost:5000/api/cart', {
        productId: p.product_id,
        quantity: qty,
      })
      const key = `cart_${localStorage.getItem('user_id')}`
      const cart = JSON.parse(localStorage.getItem(key)) || []
      const idx = cart.findIndex(i => i.product_id === p.product_id)
      if (idx >= 0) cart[idx].quantity += qty
      else cart.push({ ...p, quantity: qty })
      localStorage.setItem(key, JSON.stringify(cart))
      alert(`Berhasil menambahkan ${qty} × ${p.product_name}`)
    } catch {
      alert('Gagal menambahkan ke keranjang')
    }
  }

  return (
    <div className="p-4 md:px-24 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Cari Produk Kami</h1>
        <div className="relative w-full md:w-48">
          <select
            className="w-full appearance-none border border-gray-300 rounded px-4 py-2 bg-white"
            value={productName}
            onChange={e => setProductName(e.target.value)}
          >
            <option value="">Pilih produk</option>
            <option value="CNP (KANAL C)">CNP (Kanal C)</option>
            <option value="Reng">Reng</option>
            <option value="Spandek">Spandek</option>
            <option value="Bondek">Bondek</option>
            <option value="Flatseat">Flatseat</option>
            <option value="Nok C">Nok C</option>
            <option value="Hollow">Hollow</option>
            <option value="Genteng Metal">Genteng Metal</option>
            <option value="Talang Juray">Talang Juray</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <FontAwesomeIcon icon={faChevronDown} />
          </div>
        </div>
      </div>

      <Catalog onSelectProduct={setProductName} />

      <div className="mt-8">
        {productName === '' ? (
          <p className="text-center text-gray-500">
            Silakan pilih barang untuk melihat produk lengkap.
          </p>
        ) : (
          <div className="space-y-6">
            {products.map(p => (
              <div
                key={p.product_id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1">
                  <h2 className="font-bold text-lg">
                    {p.product_name} {p.type}, Tebal {p.thick}, {p.avg_weight_per_stick} Kg
                  </h2>
                  {isLoggedIn && (
                    <p className="mt-1 text-sm text-gray-600">Stok: {p.stock}</p>
                  )}
                </div>
                {isLoggedIn ? (
                  <div className="flex items-center gap-4">
                    <span className="font-bold whitespace-nowrap">
                      Rp{p.unit_price.toLocaleString()}
                    </span>
                    <div className="flex items-center border border-gray-300 rounded">
                      <button onClick={() => dec(p.product_id)} className="px-3 py-1">
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span className="px-3">{quantities[p.product_id]}</span>
                      <button onClick={() => inc(p.product_id)} className="px-3 py-1">
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="whitespace-nowrap bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded"
                    >
                      Tambah
                    </button>
                  </div>
                ) : (
                  <p className="italic text-gray-400">
                    Login untuk lihat harga & stok
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Product
