import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faXmark, faChevronDown, faFile } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getMonth, getYear } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const backendURL = 'https://bbn-web-production.up.railway.app';

  const statusLabels = {
    unpaid: 'Belum Dibayar',
    pending: 'Menunggu',
    processing: 'Dikemas',
    ready: 'Siap Diambil',
    shipped: 'Diantar',
    delivered: 'Diterima',
    picked_up: 'Diambil',
    cancel: 'Batal',
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
      const res = await fetch(`${backendURL}/api/admin/orders`, {
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

    setFilteredOrders(result);
  }, [orders, filterMethod, filterMonthYear]);

  const getPaymentStatus = (order) => {
    const payments = order.payments || [];

    const hasFullPayment = payments.some(p => p.payment_type === 'fullpayment' && p.status === 'complete');
    if (hasFullPayment) return 'Lunas';

    const hasDpPaid = payments.some(p => p.payment_type === 'downpayment' && p.status === 'dp_paid');
    const hasSettlementComplete = payments.some(p => p.payment_type === 'settlement' && p.status === 'completed');
    if (hasDpPaid && hasSettlementComplete) return 'Lunas';

    if (order.delivery_method === 'pickup' &&
        (order.status === 'processing' || order.status === 'ready' || order.status === 'picked_up' || order.status === 'delivered')) {
        return 'Lunas';
    }

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
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Daftar Pesanan", 14, 20);

    const tableData = filteredOrders.map((order, index) => [
      index + 1,
      order.order_id,
      order.shop_name,
      new Date(order.order_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      statusLabels[order.status] || order.status,
      getPaymentStatus(order),
      `Rp ${order.total_price.toLocaleString()}`,
      order.delivery_method === 'delivery' ? 'Antar' : 'Ambil',
      order.location,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['No', 'ID Pesanan', 'Nama Toko', 'Tanggal', 'Status Pesanan', 'Status Pembayaran', 'Total', 'Metode', 'Lokasi']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save('daftar-pesanan.pdf');
    showNotification('Laporan PDF berhasil diunduh.', 'success');
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No admin token found. Please log in.');
      }

      const res = await fetch(`${backendURL}/api/admin/orders/${orderId}/status`, {
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

      setOrders(prev =>
        prev.map(o => (o.order_id === orderId ? { ...o, status: newStatus } : o))
      );

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
    formData.append('file', file);

    try {
      const res = await fetch(`${backendURL}/api/admin/orders/${orderId}/upload-do`, {
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
      const res = await fetch(`${backendURL}/api/orders/${orderId}/estimated-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estimated_date: newEstimate }),
      });

      if (!res.ok) throw new Error('Gagal mengubah estimasi');

      setOrders(prev =>
        prev.map(o =>
          o.order_id === orderId ? { ...o, estimated_date: newEstimate } : o
        )
      );
      showNotification('Estimasi waktu berhasil diubah', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Gagal mengubah estimasi waktu', 'error');
    }
  };

  const openModal = order => setSelectedOrder(order);
  const closeModal = () => setSelectedOrder(null);

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
            <button
              onClick={handleExportPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors shadow"
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
                    const currentOrderPaymentStatus = currentPaymentStatus;

                    if (isStatusFinal) {
                      showNotification('Status pesanan sudah final dan tidak dapat diubah.', 'error');
                      e.target.value = order.status;
                      return;
                    }

                    if (isDelivery && newStatus === 'shipped' && currentOrderPaymentStatus === 'Belum Lunas') {
                        showNotification('Status pembayaran belum lunas. Pesanan tidak bisa diantar.', 'error');
                        e.target.value = order.status;
                        return;
                    }

                    if (isDelivery && newStatus === 'delivered') {
                        if (currentOrderPaymentStatus === 'Belum Lunas') {
                            showNotification('Status pembayaran belum lunas. Pesanan tidak bisa ditandai selesai.', 'error');
                            e.target.value = order.status;
                            return;
                        }
                        if (!window.confirm(`Yakin ingin mengubah status pesanan #${currentOrderId} menjadi 'Diterima'?`)) {
                            e.target.value = order.status;
                            return;
                        }
                    }

                    if (!isDelivery && newStatus === 'picked_up') {
                        if (currentOrderPaymentStatus === 'Belum Lunas') {
                            showNotification('Status pembayaran belum lunas. Pesanan tidak bisa ditandai diambil.', 'error');
                            e.target.value = order.status;
                            return;
                        }
                        if (!window.confirm(`Yakin ingin mengubah status pesanan #${currentOrderId} menjadi 'Diambil'?`)) {
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
                      <td className="px-4 py-3">
                        {new Date(order.order_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                            <select
                                value={order.status}
                                onChange={handleStatusChangeInRow}
                                className={`bg-white border border-gray-300 rounded-md px-2 py-1 pr-8 text-xs appearance-none w-full
                                    ${isStatusFinal ? 'bg-gray-200 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                                disabled={isStatusFinal}
                            >
                                {isDelivery ? (
                                    <>
                                        <option value="unpaid">{statusLabels.unpaid}</option>
                                        <option value="processing">{statusLabels.processing}</option>
                                        <option value="shipped">{statusLabels.shipped}</option>
                                        <option value="delivered">{statusLabels.delivered}</option>
                                        <option value="cancel">{statusLabels.cancel}</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="unpaid">{statusLabels.unpaid}</option>
                                        <option value="pending">{statusLabels.pending}</option>
                                        <option value="processing">{statusLabels.processing}</option>
                                        <option value="ready">{statusLabels.ready}</option>
                                        <option value="picked_up">{statusLabels.picked_up}</option>
                                        <option value="cancel">{statusLabels.cancel}</option>
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
                                accept=".pdf,.jpg,.png"
                                onChange={e => {
                                  const file = e.target.files[0];
                                  handleUploadDO(order.order_id, file);
                                  setSelectedFiles(prev => ({ ...prev, [order.order_id]: file?.name || 'Belum ada file' }));
                                }}
                                className="hidden"
                              />
                            </label>

                            {order.file_delivery_order ? (
                              <a href={`${backendURL}${order.file_delivery_order}`} target="_blank" rel="noopener noreferrer" className='text-blue-600 hover:text-blue-800 text-xs underline'>
                                Lihat File DO
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500 truncate w-24">
                                {selectedFiles[order.order_id] || 'Belum ada file'}
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
          <div className="bg-white rounded-lg shadow-xl max-w-lg md:max-w-3xl w-full max-h-[90vh] overflow-y-auto relative p-6">
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