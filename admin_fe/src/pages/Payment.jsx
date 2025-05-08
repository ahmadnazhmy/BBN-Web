import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { faChevronDown, faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getYear, getMonth } from 'date-fns';
import { id } from 'date-fns/locale';

function Payment() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [filterMonthYear, setFilterMonthYear] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

  const statusLabels = {
    pending: 'Verifikasi',
    completed: 'Berhasil',
    failed: 'Gagal',
  };

  useEffect(() => {
    let result = payments; 

    if (filterMonthYear) {
      const selectedYear = getYear(filterMonthYear);
      const selectedMonth = getMonth(filterMonthYear) + 1; 

      result = result.filter(p => {
        const paymentDate = new Date(p.created_at);
        const paymentYear = paymentDate.getFullYear();
        const paymentMonth = paymentDate.getMonth() + 1;

        return paymentYear === selectedYear && paymentMonth === selectedMonth;
      });
    }

    setFilteredPayments(result);

    const total = result.reduce((sum, payment) => sum + payment.amount, 0);
    setTotalAmount(total);
  }, [payments, filterMonthYear]);

  useEffect(() => {
    fetchPayments();
  }, [filterMonthYear]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const query = new URLSearchParams();
  
      if (filterMonthYear) {
        const month = filterMonthYear.getMonth() + 1;
        const year = filterMonthYear.getFullYear();
        query.append('month', month);
        query.append('year', year);
      }
  
      const res = await fetch(`http://localhost:5000/api/admin/payment?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!res.ok) throw new Error('Gagal mengambil data pembayaran');
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (paymentId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/admin/payment/${paymentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status');
      setPayments(prev => prev.map(p => p.payment_id === paymentId ? { ...p, status: newStatus } : p));
      const label = statusLabels[newStatus] || newStatus;
      setMessage(`Status berhasil diubah menjadi "${label}"`);
    } catch (err) {
      console.error(err);
      setMessage('Gagal mengubah status.');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const updateMessage = async (paymentId, newMessage) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:5000/api/admin/payment/${paymentId}/message`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui pesan');
      setMessage('Pesan berhasil diperbarui.');
    } catch (err) {
      console.error(err);
      setMessage('Gagal memperbarui pesan.');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) return <div className="p-6">Memuat...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 md:px-6 md:py-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold py-2">Data Pembayaran</h1>
        <div className="flex gap-4 flex-wrap items-center">
        <div className="flex items-center z-20 flex-row-reverse">
          <DatePicker
            selected={filterMonthYear}
            onChange={date => setFilterMonthYear(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="bg-white text-center border border-gray-300 text-sm px-4 py-2 rounded-xs w-[110px]"
            placeholderText="Pilih Bulan"
            locale={id}
          />
          {filterMonthYear && (
            <button
              onClick={() => setFilterMonthYear(null)}
              className={`text-sm px-4 py-2 rounded-xs transition-opacity duration-200 mr-4
                ${filterMonthYear ? 'bg-blue-800 hover:bg-blue-900 text-white' : 'opacity-0 pointer-events-none'}`}
            >
              Semua Bulan
            </button>
          )}
        </div>
        <div className="flex items-center justify-center bg-white border border-gray-300 rounded-xs px-4 py-2 text-sm">
          <span className="font-semibold">Total:</span>
          <span className="ml-2">Rp {totalAmount.toLocaleString()}</span>
        </div>
        </div>
        
      </div>

      <div className="overflow-hidden bg-white rounded-xs">
        <div className="max-h-[85vh] overflow-y-auto">
        <table className="min-w-full table-auto text-base">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {['No', 'ID', 'Nama Toko', 'Jumlah', 'Status', 'Pesan', 'Tanggal', 'Terverikasi', 'Bukti'].map(h => (
                <th key={h} className="px-4 py-3 border-b border-gray-300 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-6 text-gray-500 border-b border-gray-300"
                >
                  Tidak ada pembayaran
                </td>
              </tr>
            ) : (
              filteredPayments.map((p, idx) => (
                <tr key={p.payment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b border-gray-300">{idx + 1}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{p.order_id}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{p.shop_name}</td>
                  <td className="px-4 py-3 border-b border-gray-300">Rp {p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    <div className="relative">
                      <select
                        value={p.status}
                        onChange={e => updateStatus(p.payment_id, e.target.value)}
                        className="bg-white border border-gray-300 rounded-xs px-4 py-2 pr-8 text-sm md:text-base appearance-none w-full"
                      >
                        <option value="pending">Verifikasi</option>
                        <option value="completed">Berhasil</option>
                        <option value="failed">Gagal</option>
                      </select>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    {p.status === 'failed' ? (
                      <textarea
                        className="w-full border border-gray-300 rounded p-2"
                        rows="3"
                        value={p.message || ''}
                        onChange={(e) => {
                          const updatedMessage = e.target.value;
                          setPayments(prevPayments =>
                            prevPayments.map(payment =>
                              payment.payment_id === p.payment_id
                                ? { ...payment, message: updatedMessage }
                                : payment
                            )
                          );
                          updateMessage(p.payment_id, updatedMessage);
                        }}
                        placeholder="Tulis pesan untuk pengguna..."
                      />
                    ) : (
                      <span className="text-gray-500">Tidak ada pesan</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    {new Date(p.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    {p.verified_at 
                      ? new Date(p.verified_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Belum Terverifikasi'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    {p.proof_of_payment ? (
                      <a
                        href={`http://localhost:5000${p.proof_of_payment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white"
                      >
                        <button className="bg-blue-800 text-xs w-8 h-8 rounded-xs hover:bg-blue-900 transition-colors">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </a>
                    ) : (
                      'Belum ada'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        </div>
      </div>
    </div>
  );
}

export default Payment;
