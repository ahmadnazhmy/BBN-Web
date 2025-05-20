import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function RetryPayment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login'); 
      return;
    }
    
    const fetchOrder = async () => {
      try {
        const res = await fetch(`https://bbn-web-production.up.railway.app/api/order/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setOrder(data);
        setAmount(data.total_price);
      } catch (err) {
        console.error('Gagal ambil data order:', err);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId, token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Pilih file bukti pembayaran terlebih dahulu');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('proof', file);
    formData.append('order_id', orderId);
    formData.append('amount', amount);

    try {
      const res = await fetch('https://bbn-web-production.up.railway.app/api/upload-proof', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, 
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload gagal');
      alert('Bukti pembayaran berhasil diunggah!');
      navigate('/history');
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.message || 'Gagal mengunggah bukti pembayaran');
    }
  };

  const handleCancelPayment = async () => {
    if (!window.confirm('Apakah kamu yakin ingin membatalkan pembayaran ini?')) return;
    try {
      const res = await fetch(`https://bbn-web-production.up.railway.app/api/order/${orderId}/cancel-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal membatalkan pembayaran');
      alert('Pembayaran berhasil dibatalkan');
      navigate('/history');
    } catch (err) {
      console.error('Cancel error:', err);
      alert(err.message || 'Terjadi kesalahan saat membatalkan');
    }
  };

  if (!order) return <div className="p-6">Memuat data order...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl bg-white border border-gray-300 shadow-md rounded-xs p-6">
        <div className="w-full md:w-2/3 space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center md:text-left">Bayar Ulang Pesanan #{orderId}</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="font-bold align-top pr-4">Alamat</td>
                <td className="align-top">{order.location}</td>
              </tr>
              <tr>
                <td className="font-bold align-top pr-4">Tanggal</td>
                <td className="align-top">{new Date(order.order_date).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {(!order.payment || order.payment.status === 'pending' || order.payment.status === 'failed') && (
            <form onSubmit={handleUpload} className="space-y-4 pt-4">
              <div>
                <label className="block mb-1 font-bold">Upload Bukti Pembayaran</label>
                <div className="flex items-center space-x-4">
                  <label htmlFor="upload" className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-xs cursor-pointer">
                    Pilih File
                  </label>
                  <span className="text-sm text-gray-600">
                    {file ? file.name : 'Belum ada file dipilih'}
                  </span>
                </div>
                <input id="upload" type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="hidden" />
              </div>

              <button type="submit" className="w-full bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-xs">
                Upload Bukti Pembayaran
              </button>
              <p onClick={handleCancelPayment} className="text-red-600 text-center underline cursor-pointer">
                Batal bayar
              </p>
            </form>
          )}
        </div>

        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200 pl-0 md:pl-6 pt-4 md:pt-0">
          <p className="font-bold mb-3">Daftar Barang</p>
          <ul className="space-y-2">
            {order.items?.map((item, idx) => (
              <li key={`${item.product_id}-${idx}`} className="flex justify-between border-b pb-2 text-sm">
                <span className="flex items-center gap-x-2">
                  <span className="bg-blue-800 text-white rounded-xs w-6 h-6 flex items-center justify-center text-xs">
                    {item.quantity}
                  </span>
                  <span>
                    {item.product_name}{item.type ? ` ${item.type}` : ''}{item.thick ? ` Tebal ${item.thick}` : ''}{item.avg_weight_per_stick ? ` ${item.avg_weight_per_stick} Kg` : ''}
                  </span>
                </span>
                <span className="flex items-center">Rp {item.subtotal.toLocaleString()}</span>
              </li>
            ))}
          </ul>

          <div className="text-right mt-4 font-bold text-lg">
            Total: Rp {order.total_price.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RetryPayment;