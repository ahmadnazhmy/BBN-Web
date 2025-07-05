import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Catalog from './Catalog';
import API_BASE_URL from '../api';

const Product = () => {
    const [productName, setProductName] = useState('');
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isLoggedIn = !!localStorage.getItem('token');

    async function fetchProducts() {
        setLoading(true);
        setError(null);
        try {
            let url = `${API_BASE_URL}/product`;
            if (productName) {
                const params = new URLSearchParams();
                params.append('product_name', productName);
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setProducts(data);
            const initQty = {};
            data.forEach((p) => {
                initQty[p.product_id] = 1;
            });
            setQuantities(initQty);
        } catch (err) {
            console.error('Gagal fetch produk:', err);
            setError('Gagal memuat produk. Silakan coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts();
    }, [productName]);

    const handleAddToCart = async (p) => {
        if (!isLoggedIn) {
            alert('Silakan login untuk menambahkan produk ke keranjang.');
            return;
        }
        const qty = quantities[p.product_id];
        if (!qty || qty < 1) {
            alert('Jumlah produk harus lebih dari 0.');
            return;
        }

        try {
            await axios.post(
                `${API_BASE_URL}/cart`,
                {
                    productId: p.product_id,
                    quantity: qty,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            const key = `cart_${localStorage.getItem('user_id')}`;
            const cart = JSON.parse(localStorage.getItem(key)) || [];
            const idx = cart.findIndex((item) => item.product_id === p.product_id);
            if (idx >= 0) {
                cart[idx].quantity = (cart[idx].quantity || 0) + qty;
            } else {
                cart.push({ ...p, quantity: qty });
            }
            localStorage.setItem(key, JSON.stringify(cart));
            alert(`Berhasil menambahkan ${qty}x ${p.product_name} ke keranjang!`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Gagal menambahkan ke keranjang. Silakan coba lagi.');
        }
    };

    const handleQtyChange = (productId, value) => {
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue) || parsedValue < 1) {
            setQuantities((prev) => ({ ...prev, [productId]: 1 })); 
            return;
        }
        setQuantities((prev) => ({ ...prev, [productId]: parsedValue }));
    };

    return (
        <div className="bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h1 className="text-xl md:text-2xl text-center md:text-left font-bold text-gray-900 leading-tight">Jelajahi Produk Kami</h1>
                    <div className="relative w-full md:w-64">
                        <select
                            className="block w-full px-4 py-2 pr-10 text-base text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200 ease-in-out"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        >
                            <option value="">Pilih Kategori Produk</option>
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                            <FontAwesomeIcon icon={faChevronDown} className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <Catalog />

                <div className="mt-8">
                    {loading ? (
                        <p className="text-center text-gray-600 text-lg">Memuat produk...</p>
                    ) : error ? (
                        <p className="text-center text-red-600 text-lg">{error}</p>
                    ) : productName === '' ? (
                        <p className="text-center text-gray-500 text-lg">
                            Silakan pilih kategori produk di atas untuk melihat daftar lengkap produk.
                        </p>
                    ) : products.length === 0 ? (
                        <p className="text-center text-gray-500 text-lg">
                            Tidak ada produk ditemukan untuk kategori "{productName}".
                        </p>
                    ) : (
                        <>
                            {!isLoggedIn && (
                                <p className="text-center italic text-gray-500 text-base mb-6">
                                    Silakan login untuk melihat harga dan menambah ke keranjang.
                                </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((p) => (
                                    <div
                                        key={p.product_id}
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200 ease-in-out"
                                    >
                                        <div>
                                            <h2 className="font-bold text-base sm:text-lg text-gray-900 mb-2 leading-snug">
                                                {p.product_name} {p.type}, Tebal {p.thick}, {p.avg_weight_per_stick} Kg
                                            </h2>
                                        </div>

                                        {isLoggedIn ? (
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between sm:justify-between gap-3 sm:gap-4">
                                                <span className="font-extrabold text-lg sm:text-xl text-blue-700 whitespace-nowrap">
                                                    Rp{Number(p.unit_price).toLocaleString('id-ID')}
                                                </span>
                                                <div className="flex items-center gap-2"> 
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={quantities[p.product_id] || 1}
                                                        onChange={(e) => handleQtyChange(p.product_id, e.target.value)}
                                                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center text-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    />
                                                    <button
                                                        onClick={() => handleAddToCart(p)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-md shadow-sm transition-colors duration-200 ease-in-out text-sm"
                                                    >
                                                        Tambah
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                                <p className="italic text-gray-500 text-base">
                                                    Harga tidak tersedia.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Product;
