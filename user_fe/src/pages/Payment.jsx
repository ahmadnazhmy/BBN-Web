import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faExclamationCircle, faCheckCircle, faInfoCircle, faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons'; 

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [order, setOrder] = useState(null); 
  const [payment, setPayment] = useState(null);
  const [allPaymentsForOrder, setAllPaymentsForOrder] = useState([]);
  const [paymentType, setPaymentType] = useState("downpayment");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [error, setError] = useState(null);
  const queryParams = new URLSearchParams(location.search);
  const paymentIdFromUrl = queryParams.get('payment_id');

  const formatCurrency = (value) => {
    if (isNaN(value) || value === null) return 'Rp 0';
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
  };

  const translatePaymentStatus = useCallback((status) => {
    switch ((status || '').toLowerCase()) {
      case 'dp_paid': return 'Uang Muka Diterima';
      case 'fullpayment_paid': return 'Pelunasan Diterima';
      case 'completed': return 'Pembayaran Berhasil';
      case 'failed': return 'Pembayaran Gagal';
      case 'pending_dp': return 'Menunggu Verifikasi DP';
      case 'pending_fullpayment': return 'Menunggu Verifikasi Pelunasan';
      case 'pending_settlement': return 'Menunggu Verifikasi Pelunasan';
      case 'settlement': return 'Sudah Dibayar';
      default: return 'Status Tidak Dikenal';
    }
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!paymentIdFromUrl) {
      setError('ID Pembayaran tidak ditemukan di URL. Mohon periksa kembali link Anda.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://bbn-web-production.up.railway.app/api/payment/order-details?payment_id=${paymentIdFromUrl}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        if (!data.order || !data.payment) {
            setError('Data order atau pembayaran tidak ditemukan.');
            setLoading(false);
            return;
        }

        setOrder({ ...data.order, items: data.items || [] });
        setPayment(data.payment); 
        setAllPaymentsForOrder(data.payments || []);

        const currentOrderTotalPrice = data.order.total_price || 0;
        const allPayments = data.payments || [];

        const totalPaidDP = allPayments
          .filter(p => p.payment_type === 'downpayment' && (p.status === 'dp_paid' || p.status === 'completed'))
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const currentPayment = data.payment;


        if (currentPayment.payment_type === 'fullpayment') {
          setPaymentType('fullpayment');
          setAmount(currentOrderTotalPrice.toString());
        } else if (currentPayment.payment_type === 'downpayment') {
          setPaymentType('downpayment');
          const requiredDP = Math.ceil(currentOrderTotalPrice * 0.2);
          setAmount(requiredDP.toString());
        } else if (currentPayment.payment_type === 'settlement') {
          setPaymentType('settlement');
          const remaining = currentOrderTotalPrice - totalPaidDP;
          setAmount(remaining > 0 ? remaining.toString() : '0');
        } else {
          setPaymentType('downpayment');
          setAmount(Math.ceil(currentOrderTotalPrice * 0.2).toString());
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Gagal memuat data pembayaran: ' + err.message);
        if (err.message.includes('401') || err.message.includes('403')) {
          localStorage.removeItem('token');
          navigate('/login', { state: { from: location.pathname } });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [paymentIdFromUrl, token, navigate, location.pathname, translatePaymentStatus]);


  const orderId = order?.order_id || order?.id;

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Mohon pilih file bukti pembayaran terlebih dahulu.');
      return;
    }
    if (!method) {
      alert('Mohon pilih metode pembayaran terlebih dahulu.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) { 
      alert('Ukuran file maksimal 2MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('Format file tidak didukung. Mohon unggah gambar JPG, JPEG, atau PNG.');
        return;
    }

    const numAmount = Number(amount);
    const orderTotalPrice = order?.total_price || 0;

    const totalPaidDP = allPaymentsForOrder
      .filter(p => p.order_id === orderId && (p.payment_type === 'downpayment' || p.payment_type === 'settlement') && (p.status === 'dp_paid' || p.status === 'completed'))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const remainingAmountToPay = orderTotalPrice - totalPaidDP;
    const requiredDP = Math.ceil(orderTotalPrice * 0.2);

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Jumlah pembayaran harus berupa angka positif.');
      return;
    }

    if (paymentType === 'downpayment') {
      if (numAmount !== requiredDP) {
        alert(`Untuk DP, jumlah harus tepat ${formatCurrency(requiredDP)}.`);
        return;
      }
    } else if (paymentType === 'settlement') {
      if (remainingAmountToPay <= 0) {
        alert('Pesanan ini sudah lunas, tidak perlu pelunasan.');
        return;
      }
      if (numAmount < remainingAmountToPay) {
        const confirmPartial = window.confirm(`Jumlah yang Anda masukkan (${formatCurrency(numAmount)}) kurang dari sisa pelunasan (${formatCurrency(remainingAmountToPay)}). Lanjutkan dengan pembayaran sebagian?`);
        if (!confirmPartial) return;
      }
    } else if (paymentType === 'fullpayment') {
      if (numAmount !== orderTotalPrice) {
        alert(`Untuk pembayaran penuh, jumlah harus tepat ${formatCurrency(orderTotalPrice)}.`);
        return;
      }
    }

    if (!orderId) {
      alert('Terjadi kesalahan: Order ID tidak ditemukan.');
      return;
    }

    const formData = new FormData();
    formData.append('proof', file);
    formData.append('order_id', orderId);
    formData.append('amount', numAmount);
    formData.append('payment_method', method);
    formData.append('payment_type', paymentType);
    formData.append('payment_id', paymentIdFromUrl);

    setLoadingUpload(true);
    try {
      const res = await fetch('https://bbn-web-production.up.railway.app/api/upload-proof', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload gagal');

      alert('Bukti pembayaran berhasil diunggah! Mohon tunggu verifikasi admin.');
      navigate(`/history`);
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!orderId) {
      alert('Order ID tidak ditemukan.');
      return;
    }

    const confirmCancel = window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Pembayaran yang sudah dilakukan mungkin tidak dapat dikembalikan.');
    if (!confirmCancel) return;

    setLoadingUpload(true);
    try {
      const res = await fetch(`https://bbn-web-production.up.railway.app/api/order/${orderId}/cancel-payment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal membatalkan pembayaran');

      alert('Pesanan berhasil dibatalkan.');
      navigate('/history');
    } catch (err) {
      console.error('Cancel error:', err);
      alert(err.message || 'Terjadi kesalahan saat membatalkan pesanan.');
    } finally {
      setLoadingUpload(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-4">
        <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-4xl mb-4" />
        <p className="text-lg font-semibold">Memuat detail pembayaran...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-6 text-center">
        <FontAwesomeIcon icon={faExclamationCircle} className="text-5xl mb-4" />
        <h2 className="text-2xl font-bold mb-3">Terjadi Kesalahan!</h2>
        <p className="text-lg mb-6">{error}</p>
        <button
          onClick={() => navigate('/history')}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-md shadow-md transition duration-200"
        >
          Kembali ke Riwayat Pesanan
        </button>
      </div>
    );
  }

  if (!order || !payment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-4">
        <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-4xl mb-4" />
        <p className="text-lg font-semibold">Data tidak lengkap. Mohon coba lagi atau hubungi dukungan.</p>
        <button
          onClick={() => navigate('/history')}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md shadow-md transition duration-200"
        >
          Kembali ke Riwayat Pesanan
        </button>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const totalPaidDPForDisplay = allPaymentsForOrder
    .filter(p => p.order_id === orderId && (p.payment_type === 'downpayment' || p.payment_type === 'settlement') && (p.status === 'dp_paid' || p.status === 'completed'))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const remainingAmountForDisplay = order.total_price - totalPaidDPForDisplay;
  const isOrderFullyPaid = remainingAmountForDisplay <= 0 && order.order_status !== 'unpaid';

  const shouldShowPaymentForm = payment && (
    payment.status === 'failed' ||
    (payment.status === 'pending_dp' && payment.payment_type === 'downpayment') ||
    (payment.status === 'pending_fullpayment' && payment.payment_type === 'fullpayment') ||
    (payment.status === 'pending_fullpayment' && payment.payment_type === 'settlement') || 
    (payment.status === 'pending_settlement' && payment.payment_type === 'settlement') ||
    (!payment.status && order.order_status === 'unpaid')
  ) && !isOrderFullyPaid;


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-in-out">
        <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-10 bg-white order-2 lg:order-1">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 text-center lg:text-left">
            Konfirmasi Pembayaran
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
            <h3 className="font-bold text-xl text-gray-800 mb-3 flex items-center">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
              Informasi Pesanan & Pembayaran
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-gray-700 text-base">
              <p className="font-semibold">Order ID:</p> <p className="font-mono text-blue-700">{order.order_id}</p>
              <p className="font-semibold">Alamat Pengiriman:</p> <p>{order.location}</p>
              <p className="font-semibold">Tanggal Pesanan:</p> <p>{formatDate(order.order_date)}</p>
              <p className="font-semibold">Tipe Pembayaran Ini:</p>
              <p className="capitalize font-semibold text-indigo-700">
                {paymentType === 'downpayment' ? 'Down Payment (DP) 20%'
                  : paymentType === 'fullpayment' ? 'Pembayaran Penuh'
                    : paymentType === 'settlement' ? 'Pelunasan Sisa'
                      : '-'}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-bold text-md text-gray-800 mb-2">No. Rekening Pembayaran:</p>
                <div className="flex items-center justify-between bg-blue-100 border border-blue-200 rounded-md p-3">
                    <span className="font-bold text-blue-800 text-lg">Mandiri: 1670006211527</span>
                    <button
                        onClick={() => navigator.clipboard.writeText('1670006211527').then(() => alert('Nomor rekening berhasil disalin!'))}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-3 flex-shrink-0"
                    >
                        Salin
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">Mohon transfer sesuai jumlah yang tertera ke rekening di atas.</p>
            </div>
          </div>

          {!shouldShowPaymentForm && (
            <div className={`mt-6 p-6 rounded-lg shadow-lg ${isOrderFullyPaid ? 'bg-green-100 border-green-400 text-green-800' : 'bg-yellow-100 border-yellow-400 text-yellow-800'}`}>
              <div className="flex items-center mb-3">
                <FontAwesomeIcon
                  icon={isOrderFullyPaid ? faCheckCircle : faInfoCircle}
                  className={`text-3xl mr-3 ${isOrderFullyPaid ? 'text-green-600' : 'text-yellow-600'}`}
                />
                <p className="font-bold text-xl">
                  Status Pembayaran Anda: {translatePaymentStatus(payment?.status)}
                </p>
              </div>
              {payment?.message && (
                <p className="text-base mb-2">Pesan Admin: <span className="font-medium">{payment.message}</span></p>
              )}
              {payment?.proof_of_payment && (
                <div className="mt-3">
                  <a
                    href={p.proof_of_payment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium text-sm"
                  >
                    Lihat Bukti Pembayaran yang Diunggah
                  </a>
                </div>
              )}
              {isOrderFullyPaid ? (
                <p className="font-bold text-xl text-green-900 mt-4 text-center">Pesanan ini sudah lunas!</p>
              ) : (
                <p className="text-center mt-4 text-gray-700 text-sm">
                  Status akan diperbarui setelah verifikasi admin. Anda bisa kembali ke{' '}
                  <span
                    className="text-blue-600 cursor-pointer hover:underline font-semibold"
                    onClick={() => navigate('/history')}
                  >
                    Riwayat Pesanan
                  </span>
                  .
                </p>
              )}
            </div>
          )}

          {shouldShowPaymentForm && (
            <form onSubmit={handleUpload} className="space-y-6 pt-6 border-t border-gray-200 mt-6">
              <h3 className="font-bold text-2xl text-gray-800 mb-4 text-center lg:text-left">
                Form Unggah Bukti Pembayaran
              </h3>

              <div className="form-group">
                <label htmlFor="amount" className="block text-base font-medium text-gray-700 mb-2">
                  Jumlah Pembayaran
                </label>
                <input
                  type="text"
                  id="amount"
                  value={formatCurrency(amount).replace('Rp', '').trim()} 
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, ''); 
                    setAmount(rawValue);
                  }}
                  onBlur={() => {
                    const val = Number(amount);
                    if (!isNaN(val)) setAmount(val.toString());
                  }}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-lg font-semibold text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  placeholder="Masukkan jumlah pembayaran"
                  readOnly={paymentType === 'fullpayment' || paymentType === 'downpayment' || paymentType === 'settlement'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod" className="block text-base font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <div className="relative">
                  <select
                    id="paymentMethod"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 pr-10 appearance-none focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-800"
                    required
                  >
                    <option value="">Pilih metode pembayaran</option>
                    <optgroup label="Transfer Bank">
                      <option value="bank_mandiri">Bank Mandiri</option>
                      <option value="bank_bca">Bank BCA</option>
                      <option value="bank_bni">Bank BNI</option>
                      <option value="bank_bri">Bank BRI</option>
                      <option value="bank_btn">Bank BTN</option>
                      <option value="bank_bsi">Bank BSI</option>
                    </optgroup>
                    <optgroup label="E-Wallet">
                      <option value="shopeepay">ShopeePay</option>
                      <option value="gopay">GoPay</option>
                      <option value="dana">DANA</option>
                    </optgroup>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-600">
                    <FontAwesomeIcon icon={faChevronDown} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="upload" className="block text-base font-medium text-gray-700 mb-2">
                  Unggah Bukti Pembayaran <span className="text-gray-500 text-sm">(JPG, PNG, maks. 2MB)</span>
                </label>
                <div className="flex items-center space-x-4 border border-gray-300 rounded-md p-3 bg-gray-50">
                  <label
                    htmlFor="upload"
                    className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md cursor-pointer text-sm font-medium transition duration-200 flex items-center"
                  >
                    <FontAwesomeIcon icon={faUpload} className="mr-2" /> Pilih File
                  </label>
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {file ? file.name : 'Belum ada file dipilih'}
                  </span>
                </div>
                <input
                  id="upload"
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-lg px-4 py-3.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                disabled={loadingUpload}
              >
                {loadingUpload ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Mengunggah...
                  </>
                ) : (
                  'Konfirmasi & Unggah Bukti Pembayaran'
                )}
              </button>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full text-indigo-700 border border-indigo-700 px-4 py-3 rounded-lg hover:bg-indigo-50 transition-colors duration-200 font-semibold text-lg"
                >
                  Bayar Nanti
                </button>
                {paymentType !== 'settlement' && (
                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors duration-200 font-semibold text-lg"
                    disabled={loadingUpload}
                  >
                    {loadingUpload ? 'Membatalkan...' : 'Batalkan Pesanan Ini'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-10 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 order-1 lg:order-2">
          <h3 className="font-extrabold text-3xl text-gray-900 mb-6 text-center lg:text-left">
            Rincian Pesanan Anda
          </h3>

          {order.items && order.items.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {order.items.map((item, i) => (
                    <li
                    key={item.id ?? i}
                    className="flex justify-between items-start text-sm border-b pb-3 last:border-b-0 last:pb-0"
                    >
                    <div className="flex-1 pr-2">
                        <p className="text-gray-800 font-medium leading-tight">
                        <span className="font-bold">{item.quantity} ×</span> {item.product_name} {item.type}
                        </p>
                        <p className="text-gray-600 text-xs mt-0.5">Tebal: {item.thick}, Avg. Berat: {item.avg_weight_per_stick} Kg</p>
                    </div>
                    <div className="text-right font-bold text-gray-900 text-base">
                        {formatCurrency(item.subtotal)}
                    </div>
                    </li>
                ))}
                </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Tidak ada item pesanan yang ditemukan.</p>
          )}

          <div className="space-y-4 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-center text-xl font-bold text-gray-900">
              <p>Total Harga Pesanan:</p>
              <p className="text-blue-700">{formatCurrency(order.total_price)}</p>
            </div>

            {totalPaidDPForDisplay > 0 && (
              <div className="flex justify-between items-center text-lg text-gray-700 border-t border-gray-200 pt-3">
                <p>Uang Muka (DP) Sudah Dibayar:</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalPaidDPForDisplay)}</p>
              </div>
            )}

            {remainingAmountForDisplay > 0 && (
              <div className="flex justify-between items-center text-xl font-bold text-red-700 border-t border-gray-200 pt-3">
                <p>Sisa Pelunasan:</p>
                <p>{formatCurrency(remainingAmountForDisplay)}</p>
              </div>
            )}

            {paymentType === 'fullpayment' && totalPaidDPForDisplay === 0 && (
              <div className="flex justify-between items-center text-xl font-bold text-blue-700 border-t border-gray-200 pt-3">
                <p>Total Pembayaran Penuh:</p>
                <p>{formatCurrency(order.total_price)}</p>
              </div>
            )}

            {paymentType === 'downpayment' && totalPaidDPForDisplay === 0 && (
              <div className="flex justify-between items-center text-xl font-bold text-blue-700 border-t border-gray-200 pt-3">
                <p>Jumlah DP (20%):</p>
                <p>{formatCurrency(Math.ceil(order.total_price * 0.2))}</p>
              </div>
            )}

            {isOrderFullyPaid && (
              <div className="flex justify-between items-center text-2xl font-extrabold text-green-700 border-t-2 border-green-300 pt-4 mt-4">
                <p>Pembayaran Lunas!</p>
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
}

export default Payment;