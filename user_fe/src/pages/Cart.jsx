import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Nav from '../components/Nav';

const Cart = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const userId = localStorage.getItem('user_id');
    const cartKey = `cart_${userId}`;

    const [cartItems, setCartItems] = useState([]);
    const [registeredAddress, setRegisteredAddress] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('registered');
    const [customLocation, setCustomLocation] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState('delivery');
    const [paymentType, setPaymentType] = useState('fullpayment');
    const [isCheckoutComplete, setIsCheckoutComplete] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const urlParams = new URLSearchParams(location.search);
        const paymentSuccess = urlParams.get('payment_success');
        if (paymentSuccess === 'true') {
            setIsCheckoutComplete(true);
            localStorage.removeItem(cartKey);
            setCartItems([]);
        } else {
            const storedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
            setCartItems(storedCart);
        }

        const fetchUser = async () => {
            try {
                const response = await fetch('https://bbn-web-production.up.railway.app/api/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await response.json();
                setRegisteredAddress(data.address);
            } catch (error) {
                console.error('Gagal ambil data user:', error);
            }
        };

        fetchUser();
    }, [location.search, cartKey, navigate]);

    const updateCart = (items) => {
        setCartItems(items);
        localStorage.setItem(cartKey, JSON.stringify(items));
    };

    const handleQtyChange = (index, value) => {
        const newQty = Math.max(1, Number(value));
        const newCart = [...cartItems];
        newCart[index].quantity = newQty;
        updateCart(newCart);
    };

    const removeItem = (index) => {
        const newCart = [...cartItems];
        newCart.splice(index, 1);
        updateCart(newCart);
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => total + item.unit_price * item.quantity, 0);
    };

    const getDownPayment = () => {
        return getTotalPrice() * 0.2;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalAddress =
            deliveryMethod === 'pickup'
                ? 'Ambil di Pabrik'
                : selectedLocation === 'registered'
                    ? registeredAddress
                    : customLocation;

        if (deliveryMethod === 'delivery' && selectedLocation === 'custom' && !customLocation.trim()) {
            alert('Harap masukkan alamat tujuan untuk pengiriman.');
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('https://bbn-web-production.up.railway.app/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    delivery_method: deliveryMethod,
                    location: finalAddress,
                    cart: cartItems,
                    payment_type: paymentType,
                    amount: paymentType === 'downpayment' ? getDownPayment() : getTotalPrice(),
                }),
            });

            const result = await response.json();

            if (response.ok && result.order_id) {
                alert(`Checkout berhasil!
Lokasi tujuan: ${finalAddress}
Metode penerimaan: ${deliveryMethod === 'delivery' ? 'Antar ke lokasi' : 'Ambil di pabrik'}
Total bayar: Rp${paymentType === 'downpayment' ? getDownPayment().toLocaleString('id-ID') : getTotalPrice().toLocaleString('id-ID')}`);

                localStorage.removeItem(cartKey);
                setCartItems([]);

                navigate(`/invoice?payment_id=${result.payment_id}`);
            } else {
                alert(`Gagal checkout: ${result?.error || 'Tidak diketahui'}`);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Terjadi kesalahan saat checkout.');
        }
    };

    if (isCheckoutComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"> 
                <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center max-w-sm w-full"> 
                    <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">Pembayaran Sukses!</h2> 
                    <p className="text-gray-700 text-base sm:text-lg mb-6">Terima kasih telah berbelanja. Pembayaran Anda berhasil.</p> 
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md transition duration-300 text-base"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Nav />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:px-24 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white rounded-lg shadow-md p-5 sm:p-6 mb-6 md:mb-0">
                        <h2 className="text-xl sm:text-2xl font-bold mb-5 text-gray-800 text-center md:text-left">Keranjang Saya</h2>
                        {cartItems.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Keranjang Anda kosong.</p>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {cartItems.map((item, index) => (
                                    <div
                                        key={item.product_id}
                                        className="flex items-center justify-between py-4"
                                    >
                                        <div className="flex-1 text-left mb-2 sm:mb-0"> 
                                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">
                                                {item.product_name} {item.type} Tebal {item.thick} {item.avg_weight_per_stick} Kg
                                            </h3>
                                            <p className="text-gray-600 text-sm">Rp{item.unit_price.toLocaleString('id-ID')}</p>
                                        </div>

                                        <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleQtyChange(index, e.target.value)}
                                                className="w-16 sm:w-20 border border-gray-300 rounded-md text-center py-1 sm:py-1.5 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                                aria-label="Jumlah produk"
                                            />
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md transition duration-200 ease-in-out flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                                                aria-label={`Hapus ${item.product_name} dari keranjang`}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                                <span className="hidden sm:inline">Hapus</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-right pt-4 sm:pt-6">
                                    <p className="text-lg sm:text-xl font-bold text-gray-800">
                                        {paymentType === 'downpayment' ? (
                                            <>DP 20% Total: Rp{getDownPayment().toLocaleString('id-ID')}</>
                                        ) : (
                                            <>Total: Rp{getTotalPrice().toLocaleString('id-ID')}</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-span-1">
                        {cartItems.length > 0 && (
                            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-5 sm:p-6 space-y-5 sm:space-y-6">
                                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 text-center md:text-left">Detail Checkout</h2>

                                <div>
                                    <label htmlFor="delivery-method" className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">
                                        Metode Penerimaan
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="delivery-method"
                                            value={deliveryMethod}
                                            onChange={(e) => setDeliveryMethod(e.target.value)}
                                            className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm sm:text-base"
                                        >
                                            <option value="delivery">Antar ke lokasi</option>
                                            <option value="pickup">Ambil di pabrik</option>
                                        </select>
                                        <FontAwesomeIcon
                                            icon={faChevronDown}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none text-sm sm:text-base"
                                        />
                                    </div>
                                </div>

                                <div className={deliveryMethod === 'pickup' ? 'opacity-60 pointer-events-none' : ''}>
                                    <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">Pilih Lokasi Tujuan</label>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-2 cursor-pointer text-sm sm:text-base">
                                            <input
                                                type="radio"
                                                name="locationOption"
                                                value="registered"
                                                checked={selectedLocation === 'registered'}
                                                onChange={() => {
                                                    setSelectedLocation('registered');
                                                    setCustomLocation('');
                                                }}
                                                disabled={deliveryMethod === 'pickup'}
                                                className="form-radio text-blue-600 h-4 w-4"
                                            />
                                            <span className="text-gray-800">{registeredAddress || 'Memuat alamat terdaftar...'}</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer text-sm sm:text-base">
                                            <input
                                                type="radio"
                                                name="locationOption"
                                                value="custom"
                                                checked={selectedLocation === 'custom'}
                                                onChange={() => setSelectedLocation('custom')}
                                                disabled={deliveryMethod === 'pickup'}
                                                className="form-radio text-blue-600 h-4 w-4"
                                            />
                                            <span className="text-gray-800">Gunakan lokasi lain</span>
                                        </label>
                                        {selectedLocation === 'custom' && deliveryMethod !== 'pickup' && (
                                            <input
                                                type="text"
                                                value={customLocation}
                                                onChange={(e) => setCustomLocation(e.target.value)}
                                                className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-sm sm:text-base"
                                                placeholder="Masukkan alamat tujuan"
                                                required
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2 text-sm sm:text-base">Jenis Pembayaran</label>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <label className="flex items-center space-x-2 cursor-pointer text-sm sm:text-base">
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value="fullpayment"
                                                checked={paymentType === 'fullpayment'}
                                                onChange={() => setPaymentType('fullpayment')}
                                                className="form-radio text-blue-600 h-4 w-4"
                                            />
                                            <span className="text-gray-800">Lunas</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer text-sm sm:text-base">
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value="downpayment"
                                                checked={paymentType === 'downpayment'}
                                                onChange={() => setPaymentType('downpayment')}
                                                className="form-radio text-blue-600 h-4 w-4"
                                            />
                                            <span className="text-gray-800">DP (Uang Muka)</span>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-md transition duration-200 ease-in-out shadow-md text-base sm:text-lg"
                                >
                                    Checkout
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
