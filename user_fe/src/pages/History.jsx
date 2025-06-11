import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faBoxOpen, faCreditCard, faTruck, faCheckCircle, faTimesCircle, faHourglassHalf, faClock, faCalendarAlt, faHandshakeSimple } from '@fortawesome/free-solid-svg-icons';

const PaymentType = {
    DOWNPAYMENT: 'downpayment',
    FULLPAYMENT: 'fullpayment',
    SETTLEMENT: 'settlement',
};

const formatPaymentType = (type) => {
    switch (type) {
        case PaymentType.SETTLEMENT:
            return 'Pelunasan DP';
        case PaymentType.DOWNPAYMENT:
            return 'Bayar DP';
        case PaymentType.FULLPAYMENT:
            return 'Lunas';
        default:
            return 'Tipe Pembayaran Lainnya';
    }
};

const translatePaymentStatus = (paymentStatus, orderStatus, paymentType) => {
    const payment = (paymentStatus || '').toLowerCase();
    const order = (orderStatus || '').toLowerCase();
    const type = (paymentType || '').toLowerCase();

    if (order === 'unpaid' && payment !== 'failed') {
        return 'Belum Bayar';
    }
    if (order === 'pending' && (payment === 'pending_dp' || payment === 'pending_fullpayment' || payment === 'pending_verification')) {
        return 'Menunggu Verifikasi';
    }

    switch (payment) {
        case 'dp_paid': return 'Uang Muka Dibayar';
        case 'fullpayment_paid': return 'Pelunasan Dibayar';
        case 'completed': return 'Pembayaran Selesai';
        case 'failed': return 'Pembayaran Gagal';
        case 'pending_dp': return 'Menunggu Uang Muka';
        case 'pending_fullpayment': return 'Menunggu Pelunasan';
        case 'pending_verification': return 'Menunggu Verifikasi';
        case 'settlement': return 'Sudah Dibayar';
        default: return 'Status Tidak Dikenal';
    }
};

const getPaymentStatusBadgeClasses = (status, orderStatus, paymentType) => {
    const translatedStatus = translatePaymentStatus(status, orderStatus, paymentType);
    if (translatedStatus.includes('Dibayar') || translatedStatus.includes('Selesai') || translatedStatus.includes('Sudah Dibayar')) {
        return 'bg-green-100 text-green-800';
    }
    if (translatedStatus.includes('Gagal') || translatedStatus.includes('Dibatalkan')) {
        return 'bg-red-100 text-red-800';
    }
    if (translatedStatus.includes('Menunggu') || translatedStatus.includes('Belum Bayar') || translatedStatus.includes('Verifikasi')) {
        return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
};

const getOrderStatusInfo = (status) => {
    const lowerStatus = (status || '').toLowerCase();
    switch (lowerStatus) {
        case 'unpaid': return { text: 'Belum Bayar', color: 'text-red-600', icon: faCreditCard };
        case 'pending': return { text: 'Sedang Verifikasi', color: 'text-yellow-600', icon: faHourglassHalf };
        case 'processing': return { text: 'Sedang Diproduksi', color: 'text-blue-600', icon: faBoxOpen };
        case 'ready': return { text: 'Siap Diambil', color: 'text-teal-600', icon: faHandshakeSimple };
        case 'shipped': return { text: 'Sedang Diantar', color: 'text-purple-600', icon: faTruck };
        case 'delivered': return { text: 'Sudah Diterima', color: 'text-green-600', icon: faCheckCircle };
        case 'picked_up': return { text: 'Sudah Diambil', color: 'text-green-600', icon: faCheckCircle };
        case 'cancel': return { text: 'Dibatalkan', color: 'text-gray-600', icon: faTimesCircle };
        default: return { text: status || '-', color: 'text-gray-500', icon: faBoxOpen };
    }
};

const getPaymentDueDateInfo = (paymentStatus, dueDate) => {
    const status = (paymentStatus || '').toLowerCase();
    const now = new Date();

    if (status === 'settlement' || status === 'completed' || status === 'dp_paid' || status === 'fullpayment_paid') {
        return { text: 'Tidak ada jatuh tempo', color: 'text-gray-500' };
    }

    if (dueDate) {
        const due = new Date(dueDate);
        const formattedDueDate = due.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (due < now) {
            return { text: `Jatuh tempo: ${formattedDueDate} (Lewat batas)`, color: 'text-red-500 font-semibold' };
        } else {
            return { text: `Jatuh tempo: ${formattedDueDate}`, color: 'text-orange-500' };
        }
    }
    return { text: 'Tidak ada jatuh tempo', color: 'text-gray-500' };
};

function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const backendURL = 'https://bbn-web-production.up.railway.app';

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${backendURL}/api/user/history`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const result = await res.json();
                if (res.ok) {
                    if (Array.isArray(result)) {
                        setHistory(result);
                    } else {
                        setError('Format data tidak sesuai dari server. Harap hubungi dukungan.');
                    }
                } else {
                    setError(result.message || 'Gagal mengambil riwayat. Silakan coba lagi.');
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('token');
                        navigate('/login');
                    }
                }
            } catch (err) {
                console.error('Error fetching history:', err);
                setError('Terjadi kesalahan jaringan. Gagal memuat riwayat pesanan Anda.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [token, navigate, backendURL]);

    if (loading) {
        return (
            <>
                <Nav />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 md:px-24 md:py-12">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-4xl mb-4" />
                    <p className="text-lg text-gray-700">Memuat riwayat pesanan Anda...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Nav />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center text-red-600 p-4 text-center md:px-24 md:py-12">
                    <p className="text-xl font-semibold mb-2">Terjadi Kesalahan!</p>
                    <p className="text-lg">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                    >
                        Coba Lagi
                    </button>
                </div>
            </>
        );
    }

    const renderHistoryContent = (isMobile = false) => (
        <>
            {history.length === 0 ? (
                <div className={`text-center bg-white ${isMobile ? 'p-6 rounded-lg shadow-md mt-6' : 'p-8 rounded-lg shadow-md mt-10'}`}>
                    <FontAwesomeIcon icon={faBoxOpen} className={`text-blue-400 ${isMobile ? 'text-4xl' : 'text-5xl'} mb-4`} />
                    <p className={`font-medium ${isMobile ? 'text-lg' : 'text-xl'} text-gray-600`}>Belum ada riwayat pesanan.</p>
                    <p className={`text-gray-500 ${isMobile ? 'mt-1 text-sm' : 'mt-2'}`}>Mulai jelajahi produk kami dan buat pesanan pertama Anda!</p>
                    <button
                        onClick={() => navigate('/')}
                        className={`mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ${isMobile ? 'text-sm' : ''}`}
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {history.map((entry) => {
                        const orderStatusInfo = getOrderStatusInfo(entry.order_status);
                        const showDeliveryInfo = (entry.order_status === 'shipped' || entry.order_status === 'delivered') && entry.delivery_method === 'delivery';
                        const estimatedDeliveryDateFormatted = entry.estimated_date ? new Date(entry.estimated_date).toLocaleDateString('id-ID', {
                            weekday: 'short', month: 'short', day: 'numeric'
                        }) : null;

                        return (
                            <div
                                key={entry.order_id}
                                className="bg-white border border-gray-100 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-200">
                                    <div className="mb-2 sm:mb-0">
                                        <span className="font-bold text-xl text-gray-800 block">Pesanan #{entry.order_id}</span>
                                        <span className="text-sm text-gray-500">
                                            Tanggal Pesanan: {new Date(entry.order_date).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center text-lg">
                                            <FontAwesomeIcon icon={orderStatusInfo.icon} className={`${orderStatusInfo.color} mr-2`} />
                                            <span className={`font-semibold ${orderStatusInfo.color}`}>
                                                {orderStatusInfo.text}
                                            </span>
                                        </div>

                                        {showDeliveryInfo && estimatedDeliveryDateFormatted && (
                                            <div className="text-md text-gray-700 flex items-center justify-end">
                                                <FontAwesomeIcon icon={faClock} className="mr-2 text-blue-500" />
                                                <span>Estimasi tiba: {estimatedDeliveryDateFormatted}</span>
                                            </div>
                                        )}
                                        <div className="text-gray-800 font-extrabold text-xl mt-1">
                                            Total: Rp {Number(entry.total_price).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </div>

                                <h3 className="font-semibold text-gray-700 mb-4 text-lg">Detail Pembayaran:</h3>
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full bg-white table-auto text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 text-center text-gray-700 font-semibold border-b border-gray-200">#</th>
                                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b border-gray-200">Jenis</th>
                                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b border-gray-200">Metode</th>
                                                <th className="px-4 py-3 text-right text-gray-700 font-semibold border-b border-gray-200">Jumlah</th>
                                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b border-gray-200">Status</th>
                                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b border-gray-200">Tanggal</th>
                                                <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b border-gray-200">Jatuh Tempo</th>
                                                <th className="px-4 py-3 text-center text-gray-700 font-semibold border-b border-gray-200">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entry.payments?.length > 0 ? (
                                                entry.payments.map((p, idx) => {
                                                    const translatedPayment = translatePaymentStatus(p.status, entry.order_status, p.payment_type);
                                                    const dueDateInfo = getPaymentDueDateInfo(p.status, p.due_date);
                                                    const showCompletePaymentButton =
                                                        (p.status === 'pending_dp' || p.status === 'pending_fullpayment') ||
                                                        (p.status === 'failed' && p.payment_type !== PaymentType.SETTLEMENT && p.payment_type !== PaymentType.FULLPAYMENT) ||
                                                        (p.status === 'pending' && (entry.order_status === 'unpaid' || entry.order_status === 'pending'));

                                                    return (
                                                        <tr key={p.payment_id} className="border-b border-gray-100 last:border-b-0 hover:bg-blue-50">
                                                            <td className="px-4 py-3 text-center text-gray-800">{idx + 1}</td>
                                                            <td className="px-4 py-3 text-left text-gray-800">{formatPaymentType(p.payment_type) || '-'}</td>
                                                            <td className="px-4 py-3 text-left text-gray-800 capitalize">{p.payment_method?.replace('_', ' ') || '-'}</td>
                                                            <td className="px-4 py-3 text-right text-gray-800">Rp {Number(p.amount).toLocaleString('id-ID')}</td>
                                                            <td className="px-4 py-3 text-left text-gray-800">
                                                                <span
                                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeClasses(p.status, entry.order_status, p.payment_type)}`}
                                                                >
                                                                    {translatedPayment}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-left text-gray-800">
                                                                {new Date(p.created_at || p.date).toLocaleDateString('id-ID', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </td>
                                                            <td className="px-4 py-3 text-left text-gray-800">
                                                                <div className={`flex items-center ${dueDateInfo.color}`}>
                                                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-xs" />
                                                                    <span>{dueDateInfo.text}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <div className="flex flex-col space-y-2 items-center">
                                                                    <button
                                                                        onClick={() => navigate(`/invoice?payment_id=${p.payment_id}`)}
                                                                        className="w-40 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                                                                    >
                                                                        Lihat Invoice
                                                                    </button>
                                                                    {showCompletePaymentButton && (
                                                                        <button
                                                                            onClick={() => navigate(`/payment?order_id=${entry.order_id}&payment_id=${p.payment_id}`)}
                                                                            className="w-40 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                                                                        >
                                                                            Selesaikan Pembayaran
                                                                        </button>
                                                                    )}
                                                                    {p.status === 'failed' && (
                                                                        <button
                                                                            onClick={() => navigate(`/payment/retry?payment_id=${p.payment_id}`)}
                                                                            className="w-40 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                                                                        >
                                                                            Coba Lagi Pembayaran
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="px-4 py-3 text-center text-gray-500">
                                                        Belum ada detail pembayaran untuk pesanan ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {showDeliveryInfo && entry.file_delivery_order && (
                                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                                        <a href={entry.file_delivery_order}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-base font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                                        >
                                            Lihat File DO
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );

    return (
        <div>
            <Nav />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:px-24 md:py-12">
                <div className="hidden md:block mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">
                        Riwayat Pesanan Saya
                    </h2>
                    <div className="history-content-wrapper">
                        {renderHistoryContent(false)}
                    </div>
                </div>

                <div className="md:hidden w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
                        Riwayat Pesanan Saya
                    </h2>
                    <div className="history-content-wrapper-mobile">
                        {renderHistoryContent(true)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default History;