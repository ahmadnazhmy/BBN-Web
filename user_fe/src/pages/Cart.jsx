import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faChevronDown, faTag } from '@fortawesome/free-solid-svg-icons';
import Nav from '../components/Nav';
import API_BASE_URL from '../api';

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

  const [availableRewards, setAvailableRewards] = useState([]);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const calculateTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.unit_price * item.quantity, 0);
  }, [cartItems]);

  const calculateDownPayment = useCallback(() => {
    return finalPrice * 0.2;
  }, [finalPrice]);

  useEffect(() => {
    const fetchRewards = async () => {
      const token = localStorage.getItem('token');
      if (!userId || !token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}/rewards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          const activeRewards = data.rewards.filter(reward =>
            !reward.is_used && new Date(reward.expiry_date) >= new Date()
          );
          setAvailableRewards(activeRewards);
        } else {
          console.error('Failed to fetch rewards:', data.message);
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
      }
    };

    fetchRewards();
  }, [userId]);

  useEffect(() => {
    let currentTotal = calculateTotalPrice();
    let discountVal = 0;

    if (appliedDiscount) {
      if (appliedDiscount.discount_percentage) {
        discountVal = currentTotal * (appliedDiscount.discount_percentage / 100);
      }
    }
    setDiscountAmount(discountVal);
    setFinalPrice(currentTotal - discountVal);
  }, [cartItems, appliedDiscount, calculateTotalPrice]);

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
      setAppliedDiscount(null);
      setDiscountAmount(0);
      setFinalPrice(0);
    } else {
      const storedCart = JSON.parse(localStorage.getItem(cartKey)) || [];
      setCartItems(storedCart);
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setRegisteredAddress(data.address);
        } else {
          console.error('Failed to fetch user profile:', data.message);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
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
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCodeInput('');
    setDiscountError('');
  };

  const removeItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    updateCart(newCart);
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCodeInput('');
    setDiscountError('');
  };

  const handleApplyDiscountCode = async () => {
    if (!discountCodeInput.trim()) {
      setDiscountError('Masukkan kode diskon.');
      return;
    }
    if (!userId) {
      setDiscountError('Informasi pengguna tidak tersedia. Harap login kembali.');
      return;
    }

    setDiscountError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        user_id: userId,
        reward_code: discountCodeInput,
        current_total_amount: calculateTotalPrice(),
      };

      const response = await fetch(`${API_BASE_URL}/apply-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.reward) {
        setAppliedDiscount(result.reward);
      } else {
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setDiscountError(result.message || 'Kode diskon tidak valid atau tidak dapat digunakan.');
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      setDiscountError('Terjadi kesalahan saat menerapkan diskon.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingCheckout(true);

    const finalAddress =
      deliveryMethod === 'pickup'
        ? 'Ambil di Pabrik'
        : selectedLocation === 'registered'
          ? registeredAddress
          : customLocation;

    if (deliveryMethod === 'delivery' && selectedLocation === 'custom' && !customLocation.trim()) {
      alert('Harap masukkan alamat tujuan untuk pengiriman.');
      setLoadingCheckout(false);
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const checkoutPayload = {
        delivery_method: deliveryMethod,
        location: finalAddress,
        cart: cartItems,
        payment_type: paymentType,
        amount: paymentType === 'downpayment' ? calculateDownPayment() : finalPrice,
        applied_reward_id: appliedDiscount ? appliedDiscount.reward_id : null,
      };

      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(checkoutPayload),
      });

      const result = await response.json();

      if (response.ok && result.order_id) {
        localStorage.removeItem(cartKey);
        setCartItems([]);
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setFinalPrice(0);
        navigate(`/invoice?payment_id=${result.payment_id}`);
      } else {
        alert(`Gagal checkout: ${result?.error || 'Tidak diketahui'}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Terjadi kesalahan saat checkout.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (isCheckoutComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-sm w-full animate-fade-in">
          <h2 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">Pembayaran Sukses!</h2>
          <p className="text-gray-700 text-base sm:text-lg mb-6">Terima kasih telah berbelanja. Pembayaran Anda berhasil.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md transition duration-300 text-base shadow-md"
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
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4"
                    >
                    <div className="flex-1 text-left mb-3 sm:mb-0">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight">
                        {item.product_name} {item.type} Tebal {item.thick} {item.avg_weight_per_stick} Kg
                        </h3>
                        <p className="text-gray-600 text-sm">Rp{item.unit_price.toLocaleString('id-ID')}</p>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                        <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(index, e.target.value)}
                        className="w-20 border border-gray-300 rounded-md text-center py-1.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label="Jumlah produk"
                        />
                        <button
                        onClick={() => removeItem(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition duration-200 ease-in-out flex items-center space-x-2 shadow-sm"
                        aria-label={`Hapus ${item.product_name} dari keranjang`}
                        >
                        <FontAwesomeIcon icon={faTrash} />
                        <span className="inline">Hapus</span>
                        </button>
                    </div>
                </div>
                ))}

                <div className="text-right pt-4 sm:pt-6">
                  <p className="text-lg sm:text-xl font-bold text-gray-800">
                    Subtotal: Rp{calculateTotalPrice().toLocaleString('id-ID')}
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
                  <label htmlFor="discount-code" className="block font-semibold text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faTag} className="mr-2 text-blue-500" /> Kode Diskon
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      id="discount-code"
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      className={`flex-grow border ${discountError ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 sm:px-4 sm:py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 tm transition-all duration-200`}
                      placeholder="Masukkan kode diskon (contoh: DISCABCDE)"
                      disabled={!!appliedDiscount}
                      aria-invalid={!!discountError}
                      aria-describedby="discount-error"
                    />
                    {!appliedDiscount ? (
                      <button
                        type="button"
                        onClick={handleApplyDiscountCode}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 ease-in-out text-sm sm:text-base shadow-sm min-w-[100px]"
                      >
                        Terapkan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedDiscount(null);
                          setDiscountAmount(0);
                          setDiscountCodeInput('');
                          setDiscountError('');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm min-w-[100px]"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                  {discountError && <p id="discount-error" className="text-red-500 text-sm mt-2">{discountError}</p>}
                  {appliedDiscount && (
                    <p className="text-green-600 text-sm mt-2 flex items-center">
                      Diskon {appliedDiscount.discount_percentage}% ({appliedDiscount.code}) diterapkan: <span className="font-bold ml-1">- Rp{discountAmount.toLocaleString('id-ID')}</span>
                    </p>
                  )}
                </div>

                {/* Delivery Method */}
                <div>
                  <label htmlFor="delivery-method" className="block font-semibold text-gray-700 mb-2">
                    Metode Penerimaan
                  </label>
                  <div className="relative">
                    <select
                      id="delivery-method"
                      value={deliveryMethod}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 pr-10 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm sm:text-base shadow-sm"
                    >
                      <option value="delivery">Antar ke lokasi</option>
                      <option value="pickup">Ambil di pabrik</option>
                    </select>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Location Selection */}
                <div className={deliveryMethod === 'pickup' ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block font-semibold text-gray-700 mb-2">Pilih Lokasi Tujuan</label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
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
                    <label className="flex items-center space-x-2 cursor-pointer">
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
                      <textarea
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 sm:px-4 sm:py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 shadow-sm resize-y"
                        placeholder="Masukkan alamat tujuan"
                        rows="3"
                        required
                      ></textarea>
                    )}
                  </div>
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Jenis Pembayaran</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
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
                    <label className="flex items-center space-x-2 cursor-pointer">
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

                {/* Final Price Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                  <p className="text-lg sm:text-xl font-bold text-gray-800">
                    {paymentType === 'downpayment' ? (
                      <>DP 20% Total: <span className="text-blue-700">Rp{calculateDownPayment().toLocaleString('id-ID')}</span></>
                    ) : (
                      <>Total Akhir: <span className="text-blue-700">Rp{finalPrice.toLocaleString('id-ID')}</span></>
                    )}
                  </p>
                </div>

                {/* Checkout Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-md transition duration-200 ease-in-out shadow-md text-base sm:text-lg"
                  disabled={cartItems.length === 0 || loadingCheckout}
                >
                  {loadingCheckout ? 'Memproses Checkout...' : 'Checkout'}
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