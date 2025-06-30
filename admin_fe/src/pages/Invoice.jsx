import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../assets/images/logo.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function Invoice() {
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const admintoken = localStorage.getItem('adminToken'); 
  const invoiceRef = useRef(null);

  const statusLabels = {
    unpaid: 'Belum Dibayar',
    pending: 'Menunggu', 
    pending_dp: 'Menunggu Pembayaran DP',
    dp_paid: 'DP Terbayar',
    pending_fullpayment: 'Menunggu Pelunasan',
    fullpayment_paid: 'Lunas',
    pending_verification: 'Menunggu Verifikasi',
    completed: 'Selesai',
    failed: 'Gagal', 
    processing: 'Diproduksi',
    ready: 'Siap Diambil',
    shipped: 'Diantar',
    delivered: 'Diterima',
    picked_up: 'Diambil',
    cancel: 'Batal',
  };

  const deliveryMethodLabels = {
    pickup: 'Ambil Sendiri',
    delivery: 'Diantar',
  };

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

  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    if (!admintoken) {
      navigate('/');
      return;
    }

    if (!paymentId) {
      setError('Payment ID tidak ditemukan di URL.');
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://bbn-web-production.up.railway.app/api/admin/payment/by-id?payment_id=${paymentId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${admintoken}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const data = await res.json();
        setInvoiceData(data);
      } catch (err) {
        setError('Gagal ambil data invoice: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [paymentId, admintoken, navigate]);

  const handleGeneratePdf = async () => {
    if (!invoiceRef.current) return;

    const printButton = document.getElementById('print-pdf-button');
    const backButton = document.getElementById('back-payment-button');

    if (printButton) printButton.style.display = 'none';
    if (backButton) backButton.style.display = 'none';

    const proofImage = invoiceRef.current.querySelector('.proof-image');
    const proofText = invoiceRef.current.querySelector('.proof-text');
    if (proofImage) proofImage.style.display = 'none';
    if (proofText) proofText.style.display = 'none';

    try {
      patchColors(invoiceRef.current);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`invoice_${paymentId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      if (printButton) printButton.style.display = 'block';
      if (backButton) backButton.style.display = 'block';
      if (proofImage) proofImage.style.display = 'block';
      if (proofText) proofText.style.display = 'block';
    }
  };

  const patchColors = (element) => {
    const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
    while (treeWalker.nextNode()) {
      const el = treeWalker.currentNode;
      const style = getComputedStyle(el);

      ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
        const value = style[prop];
        if (value && value.includes('oklch')) {
          if (prop === 'backgroundColor') {
            el.style[prop] = '#fff';
          } else {
            el.style[prop] = '#000';
          }
        }
      });

      if (el.classList.contains('bg-gray-50')) {
        el.style.backgroundColor = '#f9fafb';
      }
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Memuat invoice...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );

  if (!invoiceData || !invoiceData.payment || !invoiceData.user || !invoiceData.delivery || !invoiceData.items) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-red-600">Data invoice tidak lengkap. Mohon periksa respons API.</p>
      </div>
    );
  }
  const { payment, user, delivery, items } = invoiceData;

  const grandTotalFromItems = items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

  const calculateBalanceStatus = () => {
    const currentPaymentAmount = parseFloat(payment.amount || 0);
    const remainingAfterThisPayment = grandTotalFromItems - currentPaymentAmount;

    if (remainingAfterThisPayment < 0) {
      return (
        <span className="font-bold text-green-700">
          Rp{Math.abs(remainingAfterThisPayment).toLocaleString('id-ID')} (Kelebihan Bayar)
        </span>
      );
    } else if (remainingAfterThisPayment === 0) {
      return <span className="font-bold text-green-700">Rp 0 (Lunas)</span>;
    } else {
      return (
        <span className="font-bold text-red-600">
          Rp{remainingAfterThisPayment.toLocaleString('id-ID')} (Sisa)
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden my-4">
        <div ref={invoiceRef} className="invoice-content p-6 sm:p-8 md:p-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 mb-6 border-gray-200">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <img src={Logo} alt="Logo Berlian Baja Nusantara" className="w-12 h-12 object-contain" />
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800">Berlian Baja Nusantara</h1>
              </div>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                Kawasan Industri Pergudangan Blessindo 2, Jl. Raya H. Tabri No.228 Blok P11, Kp.Nagrek, Bojongkamal, Kec. Legok, Kabupaten Tangerang, Banten 15820
              </p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                INVOICE #{payment?.payment_id || '-'}
              </h2>
              <p className="text-md text-gray-700">
                Jenis Pembayaran: <span className="font-semibold">{formatPaymentType(payment?.payment_type) || '-'}</span>
              </p>
              <p className="text-sm text-gray-600">
                Tanggal Pembayaran:
                <span className="font-medium">
                  {payment?.created_at ? formatDate(payment.created_at) : '-'}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">Informasi Pelanggan</h3>
              <p className="text-gray-700">
                <span className="font-semibold">Nama Toko:</span> {user?.shop_name || '-'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Email:</span> {user?.email || '-'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Telepon:</span> {payment?.phone || user?.phone_number || '-'}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">Detail Pesanan</h3>
              <p className="text-gray-700">
                <span className="font-semibold">Order ID:</span> {payment?.order_id ?? '-'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Tanggal Order:</span>{' '}
                {payment?.order_date ? formatDate(payment.order_date) : '-'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Metode Pembayaran:</span>{' '}
                <span className="capitalize">{formatPaymentMethod(payment?.payment_method) || '-'}</span>
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Status Pembayaran Ini:</span>{' '}
                <span className="capitalize">{statusLabels[payment?.status] || payment?.status || '-'}</span>
              </p>
            </div>
          </div>

          {delivery && (
            <div className="mb-8">
              <h3 className="font-bold text-lg text-gray-800 mb-3">Detail Pengiriman</h3>
              <p className="text-gray-700">
                <span className="font-semibold">Lokasi Tujuan:</span> {delivery.location || '-'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Metode Pengiriman:</span>{' '}
                <span className="capitalize">{deliveryMethodLabels[delivery.delivery_method] || delivery.delivery_method?.replace(/_/g, ' ') || '-'}</span>
              </p>
            </div>
          )}

          <div className="overflow-x-auto mb-8 border border-gray-200 rounded-lg">
            <table className="w-full table-auto text-left">
              <thead className="bg-gray-50">
                <tr className="text-sm font-semibold text-gray-700 uppercase">
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-center">Jumlah</th>
                  <th className="px-4 py-3 text-right">Harga Satuan</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items?.length > 0 ? (
                  items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">
                        {item.product_name} {item.type} Tebal {item.thick} {item.avg_weight_per_stick} Kg
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        Rp{Number(item.unit_price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800 font-medium">
                        Rp{Number(item.subtotal || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-center text-gray-500">
                      Tidak ada item dalam invoice.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-800">
                    Total Harga Barang:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    Rp{grandTotalFromItems.toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-800">
                    Jumlah Pembayaran Ini ({formatPaymentType(payment?.payment_type) || '-'}):
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">
                    Rp{Number(payment?.amount || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                {payment?.payment_type !== 'settlement' && (
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-800">
                      Status Saldo Setelah Pembayaran Ini:
                    </td>
                    <td className="px-4 py-3 text-right">{calculateBalanceStatus()}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          <div className="border-t pt-6 mt-6 border-gray-200">
            <p className="font-bold text-lg text-gray-800 mb-3">
              Status Pembayaran Keseluruhan Order: <span className="capitalize text-blue-700">{statusLabels[payment?.status] || payment?.status || '-'}</span>
            </p>
            {payment?.proof_of_payment ? (
              <div className="mt-4 proof-wrapper">
                <p className="proof-text text-sm text-gray-600 mb-2">Bukti Pembayaran:</p>
                <img
                  src={payment.proof_of_payment}
                  alt="Bukti Pembayaran"
                  className="proof-image w-full max-w-sm h-auto object-contain border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            ) : (
              <p className="text-gray-600 text-sm italic">Belum ada bukti pembayaran diunggah.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            id="back-payment-button"
            onClick={() => navigate('/payment')}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200 ease-in-out font-semibold shadow-sm w-full sm:w-auto"
          >
            Kembali ke Data Pembayaran
          </button>
          <button
            id="print-pdf-button"
            onClick={handleGeneratePdf}
            className="px-6 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition duration-200 ease-in-out font-semibold shadow-sm w-full sm:w-auto"
          >
            Cetak Invoice (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Invoice;