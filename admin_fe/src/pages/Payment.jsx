import React, { useEffect, useState, useRef, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { faChevronDown, faFileInvoiceDollar, faFile, faXmark, faSearch } from '@fortawesome/free-solid-svg-icons'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getYear, getMonth, format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LogoImage from '../assets/images/logo2.png';
import API_BASE_URL from '../api';

function Payment() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [filterMonthYear, setFilterMonthYear] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [animateInvoiceModal, setAnimateInvoiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: '',
    dueDate: '',
    totalAmount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');

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

  const formatPaymentMethod = (method) => {
    if (!method) return '-';
    return method
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const notificationTimeout = useRef(null);
  const location = useLocation();
  const initialPaymentId = location.state?.paymentId;

  const showNotification = useCallback((msg, type = 'success', duration = 3000) => {
    setNotification({ message: msg, type });
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    notificationTimeout.current = setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, duration);
  }, []);

  useEffect(() => {
    if (showInvoiceModal && selectedPayment && orderDetail) {
      const totalOrder = orderDetail.order.total_price;
      const amountPaid = selectedPayment.amount;

      let remainingAmount = 0;
      if (selectedPayment.payment_type === PaymentType.DOWNPAYMENT) {
        remainingAmount = totalOrder - amountPaid;
      } else {
        remainingAmount = 0;
      }

      setFormData({
        customerName: orderDetail.order.shop_name || '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        totalAmount: remainingAmount,
      });

      setSelectedOrderId(selectedPayment.order_id);
    } else {
      setFormData({
        customerName: '',
        dueDate: '',
        totalAmount: 0,
      });
      setSelectedOrderId(null);
    }
  }, [showInvoiceModal, selectedPayment, orderDetail, PaymentType.DOWNPAYMENT]);

  useEffect(() => {
    const fetchOrderDetails = async (paymentId) => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE_URL}/admin/order/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Gagal mengambil detail order');
        const data = await res.json();
        setOrderDetail(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
      }
    };

    if (showInvoiceModal && selectedPayment && selectedPayment.payment_id) {
      fetchOrderDetails(selectedPayment.payment_id);
    }
  }, [showInvoiceModal, selectedPayment, API_BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrderId) {
      showNotification('Error: Order ID tidak ditemukan untuk membuat invoice.', 'error');
      return;
    }
    setLoadingSubmit(true);

    try {
      const token = localStorage.getItem('adminToken');

      const payload = {
        order_id: selectedOrderId,
        payment_type: PaymentType.FULLPAYMENT,
        due_date: formData.dueDate,
      };

      const res = await fetch(`${API_BASE_URL}/admin/payment/invoice-settlement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal membuat invoice pelunasan.');
      }

      const newPayment = await res.json();

      showNotification('Invoice pelunasan berhasil dibuat!', 'success');
      onCloseInvoiceModal();
      fetchPayments();
    } catch (err) {
      console.error('Error submitting invoice:', err);
      showNotification(`Gagal membuat invoice pelunasan: ${err.message}`, 'error');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const statusLabels = {
    dp_paid: 'DP Dibayar',
    pending: 'Verifikasi',
    completed: 'Berhasil',
    failed: 'Gagal',
  };

  useEffect(() => {
    let result = payments;

    if (filterMonthYear) {
      const selectedMonth = filterMonthYear.getMonth();
      const selectedYear = filterMonthYear.getFullYear();

      result = result.filter((p) => {
        const paymentDate = new Date(p.created_at);
        return (
          paymentDate.getMonth() === selectedMonth &&
          paymentDate.getFullYear() === selectedYear
        );
      });
    }

    if (searchQuery) {
      result = result.filter((p) =>
        p.shop_name && p.shop_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPayments(result);

    const total = result
      .filter((p) => p.status === 'completed' || p.status === 'dp_paid')
      .reduce((sum, payment) => sum + (payment.total_price || 0), 0);
    setTotalAmount(total);
  }, [payments, filterMonthYear, searchQuery]); 

  useEffect(() => {
    fetchPayments();
    return () => {
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    };
  }, [filterMonthYear]); 

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');

      let query = new URLSearchParams();
      if (filterMonthYear) {
        query.append('month', filterMonthYear.getMonth() + 1);
        query.append('year', filterMonthYear.getFullYear());
      }

      const url = `${API_BASE_URL}/admin/payment${query.toString() ? '?' + query.toString() : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Gagal mengambil data pembayaran');
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat mengambil data.');
      showNotification('Terjadi kesalahan saat mengambil data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasFullPayment = (orderId) => {
    return payments.some((p) => p.order_id === orderId && p.payment_type === PaymentType.FULLPAYMENT && p.status === 'completed');
  };

  const updateStatus = async (paymentId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/admin/payment/${paymentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status');

      setPayments((prev) =>
        prev.map((p) => (p.payment_id === paymentId ? { ...p, status: newStatus } : p))
      );
      const label = statusLabels[newStatus] || newStatus;
      showNotification(`Status berhasil diubah menjadi "${label}"`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('Gagal mengubah status.', 'error');
    }
  };

  const updateMessage = async (paymentId, newMessage) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/admin/payment/${paymentId}/message`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui pesan');
      showNotification('Pesan berhasil diperbarui.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Gagal memperbarui pesan.', 'error');
    }
  };

  const openInvoiceModal = (payment) => {
    setSelectedPayment(payment);
    setSelectedOrderId(payment.order_id);
    setShowInvoiceModal(true);
    setTimeout(() => {
      setAnimateInvoiceModal(true);
    }, 50);
  };

  const onCloseInvoiceModal = () => {
    setAnimateInvoiceModal(false);
    setTimeout(() => {
      setShowInvoiceModal(false);
      setSelectedPayment(null);
      setOrderDetail(null);
      setSelectedOrderId(null);
      setFormData({
        customerName: '',
        dueDate: '',
        totalAmount: 0,
      });
    }, 300);
  };

  const handleExportPDF = () => {
    const getMonthName = (monthNumber) => {
      const date = new Date(2000, monthNumber - 1, 1);
      return date.toLocaleString("id-ID", { month: "long" });
    };

    if (!filteredPayments || filteredPayments.length === 0) {
      showNotification("Tidak ada pembayaran untuk diekspor.", 'error');
      return;
    }

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const selectedMonthNumber = filterMonthYear ? getMonth(filterMonthYear) + 1 : new Date().getMonth() + 1;
    const selectedYear = filterMonthYear ? getYear(filterMonthYear) : new Date().getFullYear();
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
      const splitAddress = doc.splitTextToSize(addressText, pageWidth / 3 - 10);
      doc.text(splitAddress, 38, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Pembayaran", pageWidth - 14, 15, {
        align: "right",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Bulan: ${bulan} ${selectedYear}`, pageWidth - 14, 20, { align: "right" });
      doc.text(`Tanggal Cetak: ${tanggalCetak} pukul ${jamCetak}`, pageWidth - 14, 25, { align: "right" });

      doc.setFontSize(10);
      doc.text(`Total Pembayaran (Status Selesai/DP Dibayar): Rp ${totalAmount.toLocaleString('id-ID')}`, pageWidth - 14, 30, { align: "right" });

      const addressLinesHeight = splitAddress.length * doc.internal.getLineHeight();
      const addressBottomY = 20 + addressLinesHeight;
      const reportInfoBottomY = 30;
      const finalYForHeader = Math.max(addressBottomY, reportInfoBottomY);

      doc.setLineWidth(0.5);
      doc.line(14, finalYForHeader + 1, pageWidth - 14, finalYForHeader + 1);

      const tableHeaders = ['No', 'ID Pesanan', 'Nama Toko', 'Jumlah', 'Tipe Pembayaran', 'Metode Pembayaran', 'Status', 'Tanggal Dibuat', 'Tanggal Verifikasi', 'Jatuh Tempo'];

      const tableData = filteredPayments.map((p, index) => [
        index + 1,
        p.order_id,
        p.shop_name,
        `Rp ${p.amount.toLocaleString('id-ID')}`,
        formatPaymentType(p.payment_type),
        formatPaymentMethod(p.payment_method),
        statusLabels[p.status] || p.status,
        format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: id }),
        p.verified_at ? format(new Date(p.verified_at), "dd/MM/yyyy HH:mm", { locale: id }) : '-',
        p.due_date ? format(new Date(p.due_date), 'dd/MM/yyyy', { locale: id }) : '-',
      ]);

      const tableLeftMargin = 14;
      const tableRightMargin = 14;
      const availableTableWidth = pageWidth - tableLeftMargin - tableRightMargin;

      const columnWidths = {
        0: availableTableWidth * 0.03,
        1: availableTableWidth * 0.09,
        2: availableTableWidth * 0.15,
        3: availableTableWidth * 0.10,
        4: availableTableWidth * 0.10,
        5: availableTableWidth * 0.10,
        6: availableTableWidth * 0.08,
        7: availableTableWidth * 0.12,
        8: availableTableWidth * 0.12,
        9: availableTableWidth * 0.11,
      };

      autoTable(doc, {
        startY: finalYForHeader + 3,
        head: [tableHeaders],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: columnWidths,
        margin: { left: tableLeftMargin, right: tableRightMargin },
        didDrawPage: function (data) {
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      });

      doc.save("Laporan_Pembayaran.pdf");
      showNotification('Laporan PDF berhasil diunduh.', 'success');
    };

    img.onerror = () => {
      showNotification("Gagal memuat logo untuk ekspor PDF. Mencoba membuat laporan tanpa logo.", 'error');

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Berlian Baja Nusantara", 14, 15);
      doc.setFontSize(9);
      doc.text("Kws Industri Pergudangan Blessindo 2, Jl. Raya H. Tabri No.228 Blok P11, Kp.Nagrek, Bojongkamal, Kec. Legok, Kabupaten Tangerang, Banten 15820", 14, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Pembayaran", pageWidth - 14, 15, { align: "right" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Bulan: ${bulan} ${selectedYear}`, pageWidth - 14, 20, { align: "right" });
      doc.text(`Tanggal Cetak: ${tanggalCetak} pukul ${jamCetak}`, pageWidth - 14, 25, { align: "right" });

      doc.setFontSize(10);
      doc.text(`Total Pembayaran (Status Selesai/DP Dibayar): Rp ${totalAmount.toLocaleString('id-ID')}`, pageWidth - 14, 30, { align: "right" });

      const headerOffset = 40;
      doc.setLineWidth(0.5);
      doc.line(14, headerOffset - 1, pageWidth - 14, headerOffset - 1);

      const tableHeaders = ['No', 'ID Pesanan', 'Nama Toko', 'Jumlah', 'Tipe Pembayaran', 'Metode Pembayaran', 'Status', 'Tanggal Dibuat', 'Tanggal Verifikasi', 'Jatuh Tempo'];

      const tableData = filteredPayments.map((p, index) => [
        index + 1,
        p.order_id,
        p.shop_name,
        `Rp ${p.amount.toLocaleString('id-ID')}`,
        formatPaymentType(p.payment_type),
        formatPaymentMethod(p.payment_method),
        statusLabels[p.status] || p.status,
        format(new Date(p.created_at), "dd/MM/yyyy HH:mm", { locale: id }),
        p.verified_at ? format(new Date(p.verified_at), "dd/MM/yyyy HH:mm", { locale: id }) : '-',
        p.due_date ? format(new Date(p.due_date), 'dd/MM/yyyy', { locale: id }) : '-',
      ]);

      const tableLeftMargin = 14;
      const tableRightMargin = 14;
      const availableTableWidth = pageWidth - tableLeftMargin - tableRightMargin;

      const columnWidths = {
        0: availableTableWidth * 0.03,
        1: availableTableWidth * 0.09,
        2: availableTableWidth * 0.15,
        3: availableTableWidth * 0.10,
        4: availableTableWidth * 0.10,
        5: availableTableWidth * 0.10,
        6: availableTableWidth * 0.08,
        7: availableTableWidth * 0.12,
        8: availableTableWidth * 0.12,
        9: availableTableWidth * 0.11,
      };

      autoTable(doc, {
        startY: headerOffset + 3,
        head: [tableHeaders],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: columnWidths,
        margin: { left: tableLeftMargin, right: tableRightMargin },
        didDrawPage: function (data) {
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      });

      doc.save("Laporan_Pembayaran.pdf");
    };
  };

  if (loading) return <div className="p-6 text-center text-lg text-gray-600">Memuat data pembayaran...</div>;
  if (error) return <div className="p-6 text-center text-red-500 text-lg">Error: {error}</div>;

  return (
    <div className="px-6 pt-6 flex flex-col h-full bg-gray-50">
      <div className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Daftar Pembayaran</h1>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-1/3">
              <input
                type="text"
                placeholder="Cari berdasarkan Nama Toko..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-gray-300 text-sm px-4 py-2 rounded-md w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

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
                  className="w-36 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3 py-2 rounded-md transition-colors"
                >
                  Tampil Semua
                </button>
              )}
            </div>
            <div className="w-48 flex items-center justify-center bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-800 font-semibold">
              Total: Rp {totalAmount.toLocaleString('id-ID')}
            </div>
            <button
              onClick={handleExportPDF}
              className="w-40 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors shadow"
            >
              <FontAwesomeIcon icon={faFile} className="mr-2" /> Ekspor PDF
            </button>
          </div>
        </div>
        {notification.message && (
          <div className={`mt-4 px-4 py-2 rounded-md text-sm ${
            notification.type === 'success' ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
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
                  'No',
                  'ID Pesanan',
                  'Nama Toko',
                  'Jumlah',
                  'Tipe Pembayaran',
                  'Metode Pembayaran',
                  'Status',
                  'Pesan Gagal',
                  'Tanggal Dibuat',
                  'Tanggal Verifikasi',
                  'Jatuh Tempo',
                  'Invoice',
                  'Aksi',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="14" className="text-center py-8 text-gray-500">
                    Tidak ada pembayaran ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p, idx) => {
                  const showCreateInvoiceButton = p.status === 'dp_paid' && !hasFullPayment(p.order_id);
                  const isStatusDisabled = p.status === 'failed' || p.status === 'completed' || p.status === 'dp_paid';

                  return (
                    <tr key={p.payment_id} className="border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{p.order_id}</td>
                      <td className="px-4 py-3">{p.shop_name}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        Rp {(p.amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">{formatPaymentType(p.payment_type)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {p.payment_method ? formatPaymentMethod(p.payment_method) : <i className='text-gray-400'>Belum ada pembayaran</i>}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="relative">
                          <select
                            className={`bg-white border border-gray-300 rounded-md px-2 py-1 pr-8 text-xs appearance-none w-full
                              ${isStatusDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}`}
                            value={p.status}
                            onChange={(e) => updateStatus(p.payment_id, e.target.value)}
                            disabled={isStatusDisabled}
                          >
                            <option value="pending">{statusLabels.pending}</option>
                            {p.payment_type === PaymentType.DOWNPAYMENT ? (
                              <option value="dp_paid">{statusLabels.dp_paid}</option>
                            ) : (
                              <option value="completed">{statusLabels.completed}</option>
                            )}
                            <option value="failed">{statusLabels.failed}</option>
                          </select>
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'failed' ? (
                          <>
                            <textarea
                              key={p.payment_id}
                              rows={2}
                              value={p.message || ''}
                              placeholder="Masukkan pesan..."
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                setPayments(prev => prev.map(payment =>
                                  payment.payment_id === p.payment_id ? { ...payment, message: e.target.value } : payment
                                ));
                              }}
                            />
                            <button
                              onClick={() => updateMessage(p.payment_id, p.message)}
                              className="mt-1 px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition-colors"
                            >
                              Simpan Pesan
                            </button>
                          </>
                        ) : (
                          <i className='text-gray-400'>Tidak tersedia</i>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(p.created_at), 'dd MMM yyyy HH:mm:ss', { locale: id })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.verified_at
                          ? format(new Date(p.verified_at), 'dd MMM yyyy HH:mm:ss', { locale: id })
                          : <i className='text-gray-400'>Belum diverifikasi</i>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.due_date ? format(new Date(p.due_date), 'dd MMM yyyy', { locale: id }) : <i className='text-gray-400'>Tidak ada</i>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/invoice?payment_id=${p.payment_id}`)}
                          className="text-white px-2 py-1 rounded-md text-xs bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                          title="Lihat Invoice"
                        >
                          Lihat Invoice
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {showCreateInvoiceButton && (
                          <button
                            onClick={() => openInvoiceModal(p)}
                            className="text-white px-3 py-2 rounded-md text-xs bg-purple-600 hover:bg-purple-700 whitespace-nowrap transition-colors shadow-sm"
                            title="Buat Invoice Pelunasan Manual"
                          >
                            <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-2" />
                            Buat Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
          <div
            className={`
              bg-white rounded-lg shadow-xl max-w-lg md:max-w-xl w-full relative p-6
              transition-all duration-300 ease-out transform
              ${animateInvoiceModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">Buat Invoice Pelunasan</h3>
              <button onClick={onCloseInvoiceModal} className="text-gray-500 hover:text-gray-800 transition-colors">
                <FontAwesomeIcon icon={faXmark} className='text-xl md:text-3xl' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                  Nama Toko / Pelanggan
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm"
                />
              </div>

              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                  Jumlah Pelunasan
                </label>
                <input
                  type="text"
                  value={`Rp ${formData.totalAmount.toLocaleString('id-ID')}`}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm"
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Jatuh Tempo Invoice
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCloseInvoiceModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  disabled={loadingSubmit}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? 'Mengirim...' : 'Buat Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;