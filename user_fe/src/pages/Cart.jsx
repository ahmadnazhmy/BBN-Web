import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faTrash, faChevronDown } from '@fortawesome/free-solid-svg-icons';
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

  const increaseQty = (index) => {
    const newCart = [...cartItems];
    newCart[index].quantity += 1;
    updateCart(newCart);
  };

  const decreaseQty = (index) => {
    const newCart = [...cartItems];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
      updateCart(newCart);
    }
  };

  const removeItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    updateCart(newCart);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.unit_price * item.quantity, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalAddress =
      deliveryMethod === 'pickup'
        ? 'Ambil di Pabrik'
        : selectedLocation === 'registered'
        ? registeredAddress
        : customLocation;

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('https://bbn-web-production.up.railway.app/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: deliveryMethod,
          location: finalAddress,
          cart: cartItems,
        }),
      });

      const result = await response.json();
      if (response.ok && result.order_id) {
        alert(`
Checkout berhasil!
Lokasi tujuan: ${finalAddress}
Metode penerimaan: ${deliveryMethod === 'delivery' ? 'Antar ke lokasi' : 'Ambil di pabrik'}
Total bayar: Rp${getTotalPrice().toLocaleString()}
        `);

        localStorage.removeItem(cartKey);
        setCartItems([]);
        window.location.href = `/payment?order_id=${result.order_id}&payment_success=true`;
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
      <div className="text-center p-6">
        <h2 className="text-xl font-bold">Pembayaran Sukses!</h2>
        <p>Terima kasih telah berbelanja. Pembayaran Anda berhasil.</p>
      </div>
    );
  }

  return (
    <div>
      <Nav/>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-4 md:px-24 md:py-12">
      <div className="md:col-span-2 px-0 md:px-6">
        <h2 className="text-center md:text-left text-xl md:text-2xl font-bold mb-4">Keranjang Saya</h2>
        {cartItems.length === 0 ? (
          <p className="text-gray-500">Keranjang Anda kosong.</p>
        ) : (
          <div className="md:bg-white md:p-4 space-y-4 md:border border-gray-300 md:shadow-md md:rounded-md">
            {cartItems.map((item, index) => (
              <div
                key={item.product_id}
                className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-4 border-b border-gray-300 pb-4"
              >
                <div>
                  <h3 className="font-bold">{item.product_name} {item.type} Tebal {item.thick} {item.avg_weight_per_stick} Kg</h3>
                  <p className="text-gray-600">Rp{item.unit_price.toLocaleString()}</p>
                </div>

                <div className="flex items-center space-x-4 mt-3 md:mt-0">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => decreaseQty(index)}
                      className="px-3 py-1 hover:bg-gray-100"
                      aria-label="Kurangi jumlah"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="px-3">{item.quantity}</span>
                    <button
                      onClick={() => increaseQty(index)}
                      className="px-3 py-1 hover:bg-gray-100"
                      aria-label="Tambah jumlah"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    aria-label="Hapus item"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Hapus
                  </button>
                </div>
              </div>
            ))}
            <div className="text-right mt-6 font-bold text-lg">
              Total: Rp{getTotalPrice().toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="col-span-1">
        {cartItems.length > 0 && (
          <form onSubmit={handleSubmit} className="md:bg-white md:p-4 space-y-6 md:border border-gray-300 md:shadow-md md:rounded-md">
            <div className="relative">
              <label className="block font-bold mb-2">Metode Penerimaan</label>
              <div className="relative">
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded px-3 py-2"
                >
                  <option value="delivery" className="text-black">Antar ke lokasi</option>
                  <option value="pickup" className="text-black">Ambil di pabrik</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                />
              </div>
            </div>
            <div className={`${deliveryMethod === 'pickup' ? 'opacity-50 pointer-events-none select-none' : ''}`}>
              <label className="block font-bold mb-2">Pilih Lokasi Tujuan</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
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
                  />
                  {registeredAddress || 'Memuat...'}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="locationOption"
                    value="custom"
                    checked={selectedLocation === 'custom'}
                    onChange={() => setSelectedLocation('custom')}
                    disabled={deliveryMethod === 'pickup'}
                  />
                  Gunakan lokasi lain
                </label>
                {selectedLocation === 'custom' && deliveryMethod !== 'pickup' && (
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="mt-2 w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Masukkan alamat tujuan"
                    required
                  />
                )}
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-900 text-white py-2 px-4 rounded transition duration-200"
            >
              Checkout
            </button>
          </form>
        )}
      </div>
    </div>
    </div>
  );
};

export default Cart;
