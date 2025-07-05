import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faXmark, faChevronDown, faFile } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getMonth, getYear, format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LogoImage from '../assets/images/logo2.png';
import API_BASE_URL from '../api';

export default function Order() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [filterMethod, setFilterMethod] = useState('all');
    const [filterMonthYear, setFilterMonthYear] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({});
    const [showModalContent, setShowModalContent] = useState(false);
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('all'); 

    const statusLabels = {
        unpaid: 'Belum Dibayar',
        pending: 'Menunggu',
        processing: 'Diproduksi',
        ready: 'Siap Diambil',
        shipped: 'Diantar',
        delivered: 'Diterima',
        picked_up: 'Diambil',
        cancel: 'Batal',
        expired: 'Kedaluwarsa',
    };

    const showNotification = useCallback((msg, type = 'success', duration = 3000) => {
        setNotification({ message: msg, type });
        setTimeout(() => {
            setNotification({ message: '', type: '' });
        }, duration);
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/admin/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Gagal mengambil data order');
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            console.error(err);
            setError('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        let result = orders;

        if (filterMethod === 'delivery') {
            result = result.filter(o => o.delivery_method === 'delivery');
        } else if (filterMethod === 'pickup') {
            result = result.filter(o => o.delivery_method === 'pickup');
        }

        if (filterMonthYear) {
            const selectedYear = getYear(filterMonthYear);
            const selectedMonth = getMonth(filterMonthYear) + 1;

            result = result.filter(o => {
                const orderDate = new Date(o.order_date);
                const orderYear = orderDate.getFullYear();
                const orderMonth = orderDate.getMonth() + 1;

                return orderYear === selectedYear && orderMonth === selectedMonth;
            });
        }

        // Apply payment status filter
        if (filterPaymentStatus !== 'all') {
            result = result.filter(o => {
                const status = getPaymentStatus(o);
                return (filterPaymentStatus === 'paid' && status === 'Lunas') ||
                       (filterPaymentStatus === 'unpaid' && status === 'Belum Lunas');
            });
        }

        setFilteredOrders(result);
    }, [orders, filterMethod, filterMonthYear, filterPaymentStatus]); // Add filterPaymentStatus to dependencies

    const getPaymentStatus = (order) => {
        const payments = order.payments || [];

        const hasFullPayment = payments.some(p => p.payment_type === 'fullpayment' && p.status === 'completed');
        if (hasFullPayment) return 'Lunas';

        const hasDpPaid = payments.some(p => p.payment_type === 'downpayment' && p.status === 'dp_paid');
        const hasSettlementComplete = payments.some(p => p.payment_type === 'settlement' && p.status === 'completed');
        if (hasDpPaid && hasSettlementComplete) return 'Lunas';

        return 'Belum Lunas';
    };

    const getPaymentStatusBadgeClass = (status) => {
        switch (status) {
            case 'Lunas':
                return 'bg-green-100 text-green-800';
            case 'Belum Lunas':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleExportPDF = () => {
    const getMonthName = (monthNumber) => {
      const date = new Date();
      date.setMonth(monthNumber - 1); 
      return date.toLocaleString("id-ID", { month: "long" });
    };

    if (!filteredOrders || filteredOrders.length === 0) {
      showNotification("Tidak ada pesanan untuk diekspor.", 'error');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const selectedMonthNumber = filterMonthYear ? getMonth(filterMonthYear) + 1 : new Date().getMonth() + 1;
    const bulan = getMonthName(selectedMonthNumber);
    
    const now = new Date();
    const tanggalCetak = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const jamCetak = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const img = new Image();
    img.src = LogoImage;

    img.onload = () => {
      doc.addImage(img, "PNG", 14, 10, 20, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Berlian Baja Nusantara", 38, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const addressText = "Kws Industri Pergudangan Blessindo 2, Jl. Raya H. Tabri No.228 Blok P11, Kp.Nagrek, Bojongkamal, Kec. Legok, Kabupaten Tangerang, Banten 15820";
      const splitAddress = doc.splitTextToSize(addressText, pageWidth / 2 - 45); 
      doc.text(splitAddress, 38, 20); 

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Pesanan", pageWidth - 14, 15, {
        align: "right",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Bulan: ${bulan}`, pageWidth - 14, 20, { align: "right" });
      doc.text(
        `Tanggal Cetak: ${tanggalCetak} pukul ${jamCetak}`,
        pageWidth - 14,
        25,
        {
          align: "right",
        }
      );

      const finalYForHeader = 20 + (splitAddress.length * doc.internal.getLineHeight()); 
      doc.setLineWidth(0.5);
      doc.line(14, finalYForHeader + 2, pageWidth - 14, finalYForHeader + 2); 

      autoTable(doc, {
        startY: finalYForHeader + 5,
        head: [
          [
            "No",
            "ID",
            "Nama Toko",
            "Tanggal",
            "Status Pesanan",
            "Status Pembayaran",
            "Total",
            "Metode",
            "Lokasi",
            "Estimasi",
          ],
        ],
        body: filteredOrders.map((order, idx) => {
          const isDelivery = order.delivery_method === 'delivery';
          const methodLabel = isDelivery ? 'Antar' : 'Ambil';
          const currentPaymentStatus = getPaymentStatus(order);

          return [
            idx + 1,
            order.order_id,
            order.shop_name, 
            new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), 
            statusLabels[order.status] || order.status, 
            currentPaymentStatus, 
            `Rp ${order.total_price.toLocaleString('id-ID')}`,
            methodLabel,
            order.location, 
            order.delivery_method === 'delivery'
              ? (order.estimated_date ? new Date(order.estimated_date).toLocaleDateString('id-ID') : 'N/A')
              : 'N/A', 
          ];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
        margin: { top: finalYForHeader + 5 }, 
      });

      doc.save("Laporan_Pesanan.pdf");
    };
  }; 

    const updateStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('No admin token found. Please log in.');
            }

            const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Gagal mengubah status');
            }

            await fetchOrders();

            const label = statusLabels[newStatus] || newStatus;
            showNotification(`Status berhasil diubah menjadi "${label}"`, 'success');

        } catch (err) {
            console.error('Frontend updateStatus error:', err);
            showNotification(err.message || 'Gagal memperbarui status', 'error');
        }
    };

    const handleUploadDO = async (orderId, file) => {
        const MAX_FILE_SIZE_MB = 10;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

        if (file.size > MAX_FILE_SIZE_BYTES) {
            showNotification(`Ukuran file melebihi batas ${MAX_FILE_SIZE_MB}MB.`, 'error');
            return;
        }

        const token = localStorage.getItem('adminToken');
        const formData = new FormData();
        formData.append('doFile', file);

        try {
            const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/upload-do`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Gagal upload file DO');
            }

            showNotification('File DO berhasil diunggah', 'success');

            fetchOrders(); 
        } catch (err) {
            console.error(err);
            showNotification(err.message || 'Gagal upload file DO', 'error');
        }
    };

    const handleEstimateChange = async (orderId, newEstimate) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${orderId}/estimated-date`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estimated_date: newEstimate }),
            });

            if (!res.ok) throw new Error('Gagal mengubah estimasi');

            fetchOrders();
            showNotification('Estimasi waktu berhasil diubah', 'success');
        } catch (err) {
            console.error(err);
            showNotification('Gagal mengubah estimasi waktu', 'error');
        }
    };

      const openModal = order => {
        setSelectedOrder(order);
        setTimeout(() => {
            setShowModalContent(true);
        }, 50);
    };

    const closeModal = () => {
        setShowModalContent(false);
        setTimeout(() => {
            setSelectedOrder(null);
        }, 300);
    };

    if (loading) return <div className="p-6 text-center text-lg">Memuat data pesanan...</div>;
    if (error) return <div className="p-6 text-center text-red-500 text-lg">Error: {error}</div>;

    return (
        <div className="px-6 pt-6 flex flex-col h-full bg-gray-50">
            <div className="p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Daftar Pesanan</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-3">
                            <DatePicker
                                selected={filterMonthYear}
                                onChange={date => setFilterMonthYear(date)}
                                dateFormat="MM/yyyy"
                                showMonthYearPicker
                                className="bg-white text-center border border-gray-300 text-sm px-4 py-2 rounded-md w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholderText="Pilih Bulan"
                                locale={id}
                            />
                            {filterMonthYear && (
                                <button
                                    onClick={() => setFilterMonthYear(null)}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-2 rounded-md transition-colors"
                                >
                                    Tampil Semua
                                </button>
                            )}
                        </div>
                        <select
                            value={filterMethod}
                            onChange={e => setFilterMethod(e.target.value)}
                            className="bg-white border border-gray-300 text-sm px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Metode</option>
                            <option value="delivery">Antar</option>
                            <option value="pickup">Ambil</option>
                        </select>
                        <select
                            value={filterPaymentStatus}
                            onChange={e => setFilterPaymentStatus(e.target.value)}
                            className="bg-white border border-gray-300 text-sm px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Status Pembayaran</option>
                            <option value="paid">Lunas</option>
                            <option value="unpaid">Belum Lunas</option>
                        </select>
                        <button
                            onClick={handleExportPDF}
                            className="w-40 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors shadow"
                        >
                            <FontAwesomeIcon icon={faFile} className="mr-2" /> Ekspor PDF
                        </button>
                    </div>
                </div>
                {notification.message && (
                    <div className={`mb-4 px-4 py-2 rounded-md text-sm ${
                        notification.type === 'success' ? 'text-blue-800 bg-blue-100' : 'text-red-800 bg-red-100'
                    }`}>
                        {notification.message}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm flex-grow overflow-hidden">
                <div className="max-h-[80vh] overflow-auto">
                    <table className="w-full text-sm text-gray-700">
                        <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                            <tr>
                                {[
                                    'No', 'ID', 'Nama Toko', 'Tanggal', 'Status Pesanan', 'Status Pembayaran', 'Total', 'Metode', 'Lokasi', 'Delivery Order', 'Estimasi', 'Detail'
                                ].map(h => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left font-semibold text-gray-700"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-8 text-gray-500">
                                        Tidak ada pesanan ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, idx) => {
                                    const isDelivery = order.delivery_method === 'delivery';
                                    const methodLabel = isDelivery ? 'Antar' : 'Ambil';
                                    const currentPaymentStatus = getPaymentStatus(order);

                                    const isStatusFinal = order.status === 'picked_up' || order.status === 'delivered' || order.status === 'cancel';

                                    const handleStatusChangeInRow = async (e) => {
                                        const newStatus = e.target.value;
                                        const currentOrderId = order.order_id;
                                        const currentOrderPaymentStatus = getPaymentStatus(order);

                                        if (isStatusFinal) {
                                            showNotification('Status pesanan sudah final dan tidak dapat diubah.', 'error');
                                            e.target.value = order.status;
                                            return;
                                        }

                                        const requiresPaymentCompletion = ['shipped', 'delivered', 'picked_up'].includes(newStatus);

                                        if (requiresPaymentCompletion && currentOrderPaymentStatus === 'Belum Lunas') {
                                            showNotification('Status pembayaran belum lunas. Pesanan tidak bisa diproses ke status ini.', 'error');
                                            e.target.value = order.status;
                                            return;
                                        }

                                        if (newStatus === 'delivered' || newStatus === 'picked_up' || newStatus === 'cancel') {
                                            if (!window.confirm(`Yakin ingin mengubah status pesanan #${currentOrderId} menjadi '${statusLabels[newStatus]}'?`)) {
                                                e.target.value = order.status; 
                                                return;
                                            }
                                        }

                                        await updateStatus(currentOrderId, newStatus);
                                    };
                                    return (
                                        <tr key={order.order_id} className="border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <td className="px-4 py-3">{idx + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{order.order_id}</td>
                                            <td className="px-4 py-3">{order.shop_name}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                            {order.order_date
                                                ? format(new Date(order.order_date), 'dd MMM yyyy HH:mm:ss', { locale: id })
                                                : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="relative">
                                                    <select
                                                        value={order.status}
                                                        onChange={handleStatusChangeInRow}
                                                        className={`bg-white border border-gray-300 rounded-md px-2 py-1 pr-8 text-xs appearance-none w-full
                                                            ${isStatusFinal || order.status === 'expired' ? 'bg-gray-200 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                                                        disabled={isStatusFinal || order.status === 'expired'} // Tambahkan 'expired' di sini
                                                    >
                                                        {isDelivery ? (
                                                            <>
                                                                <option value="unpaid">{statusLabels.unpaid}</option>
                                                                <option value="pending_fullpayment">Menunggu Pelunasan</option>
                                                                <option value="processing">{statusLabels.processing}</option>
                                                                <option value="shipped">{statusLabels.shipped}</option>
                                                                <option value="delivered">{statusLabels.delivered}</option>
                                                                <option value="cancel">{statusLabels.cancel}</option>
                                                                <option value="expired">{statusLabels.expired}</option> {/* Tambahkan ini */}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="unpaid">{statusLabels.unpaid}</option>
                                                                <option value="pending_dp">Menunggu DP</option>
                                                                <option value="processing">{statusLabels.processing}</option>
                                                                <option value="ready">{statusLabels.ready}</option>
                                                                <option value="picked_up">{statusLabels.picked_up}</option>
                                                                <option value="cancel">{statusLabels.cancel}</option>
                                                                <option value="expired">{statusLabels.expired}</option> {/* Tambahkan ini */}
                                                            </>
                                                        )}
                                                    </select>
                                                    <FontAwesomeIcon
                                                        icon={faChevronDown}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                                    />
                                                </div>
                                            </td>
                                            <td className='px-4 py-3'>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(currentPaymentStatus)}`}>
                                                    {currentPaymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                Rp {order.total_price.toLocaleString('id-ID')}
                                            </td>
                                            <td className={`px-4 py-3 font-semibold ${isDelivery ? 'text-blue-700' : 'text-purple-700'}`}>
                                                {methodLabel}
                                            </td>
                                            <td className="px-4 py-3 w-[200px] text-gray-600">{order.location}</td>

                                            <td className="px-4 py-3">
                                                {order.delivery_method !== 'pickup' ? (
                                                    <div className="flex flex-col items-start gap-2">
                                                        <label className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3 rounded-md cursor-pointer transition-colors shadow-sm">
                                                            Pilih File
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx"
                                                                onChange={e => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        handleUploadDO(order.order_id, file);
                                                                    }
                                                                }}
                                                                className="hidden"
                                                            />
                                                        </label>

                                                        {order.file_delivery_order ? (
                                                            <a href={order.file_delivery_order} target="_blank" rel="noopener noreferrer" className='text-blue-600 hover:text-blue-800 text-xs underline'>
                                                                Lihat File DO
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-500 truncate w-24">
                                                                {selectedFiles[order.order_id]?.name || 'Belum ada file'}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {order.delivery_method === 'delivery' ? (
                                                    <div>
                                                        <input
                                                            type="date"
                                                            value={order.estimated_date ? order.estimated_date.split('T')[0] : ''}
                                                            onChange={e => handleEstimateChange(order.order_id, e.target.value)}
                                                            className="w-32 border border-gray-300 px-2 py-1 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => openModal(order)}
                                                    className="text-white w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
                    <div
                        className={`
                            bg-white rounded-lg shadow-xl max-w-lg md:max-w-3xl w-full max-h-[90vh] overflow-y-auto relative p-6
                            transition-all duration-300 ease-out transform
                            ${showModalContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                        `}
                    >
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800">Detail Item Pesanan #{selectedOrder.order_id}</h3>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 transition-colors">
                                <FontAwesomeIcon icon={faXmark} className='text-xl md:text-3xl' />
                            </button>
                        </div>
                        <div className="space-y-4 text-base text-gray-700 max-h-[60vh] overflow-y-auto pr-2">
                            {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                selectedOrder.items.map(item => (
                                    <div className="flex items-start justify-between p-3 bg-gray-50 rounded-md shadow-sm" key={item.order_item_id}>
                                        <div className="flex items-center flex-grow mr-4">
                                            <span className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0">
                                                {item.quantity}
                                            </span>
                                            <span className="flex-grow font-medium text-gray-900 leading-tight">
                                                {item.product_name} {item.type} Tebal {item.thick} mm {item.avg_weight_per_stick} kg
                                            </span>
                                        </div>
                                        <span className="font-bold text-lg text-blue-700 whitespace-nowrap">
                                            Rp {item.subtotal.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">(Tidak ada item dalam pesanan ini)</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}