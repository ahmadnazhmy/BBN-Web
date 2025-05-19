import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faXmark, faChevronDown } from '@fortawesome/free-solid-svg-icons';
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
  const [message, setMessage] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterMonthYear, setFilterMonthYear] = useState(null);

  const statusLabels = {
    pending: 'Batal',
    processing: 'Dikemas',
    shipped: 'Diantar',
    delivered: 'Diterima',
    picked_up: 'Diambil',
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch('https://bbn-web-production.up.railway.app/api/admin/orders', {
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
    fetchOrders();
  }, []);

  useEffect(() => {
    let result = orders;
  
    if (filterMethod === 'delivery') {
      result = result.filter(o => o.method === 'delivery');
    } else if (filterMethod === 'pickup') {
      result = result.filter(o => o.method === 'pickup');
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
      `Rp ${order.total_price.toLocaleString()}`,
      order.method === 'delivery' ? 'Antar' : 'Ambil',
      order.location,
    ]);
  
    autoTable(doc, {
      startY: 30,
      head: [[
        'No', 'ID Pesanan', 'Nama Toko', 'Tanggal', 'Status', 'Total', 'Metode', 'Lokasi'
      ]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }, 
    });
  
    doc.save('daftar-pesanan.pdf');
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`https://bbn-web-production.up.railway.app/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status');

      setOrders(prev =>
        prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o)
      );

      const label = statusLabels[newStatus] || newStatus;
      setMessage(`Status berhasil diubah menjadi "${label}"`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status');
    }
  };

  const openModal = order => setSelectedOrder(order);
  const closeModal = () => setSelectedOrder(null);

  if (loading) return <div className="p-6">Memuat...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 md:px-6 md:py-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-bold py-2">Daftar Pesanan</h1>
        <div className="flex gap-4 flex-wrap items-center">
        <div className="flex flex-row-reverse items-center z-20">
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
                ${filterMonthYear ? 'bg-blue-800 hover:bg-blue-900 text-white' : 'opacity-0 pointer-events-none'}
              `}
            >
              Tampil Semua
            </button>
            )}

            <button
              onClick={handleExportPDF}
              className="bg-blue-800 hover:bg-blue-900 text-white text-sm px-4 py-2 rounded-xs mr-4"
            >
              Ekspor PDF
            </button>
          </div>
          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="bg-white border border-gray-300 text-sm px-4 py-2 rounded-xs"
          >
            <option value="all">Semua Metode</option>
            <option value="delivery">Antar</option>
            <option value="pickup">Ambil</option>
          </select>
        </div>
      </div>

      {message && (
        <div className="mb-4 text-blue-800 bg-blue-100 px-4 py-2 rounded-xs">
          {message}
        </div>
      )}

      <div className="overflow-hidden bg-white rounded-xs">
        <div className="max-h-[85vh] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {['No', 'ID', 'Nama Toko', 'Tanggal', 'Status', 'Total', 'Metode', 'Lokasi', 'Detail']
                .map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 border-b border-gray-300 text-left"
                  >
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-6 text-gray-500 border-b border-gray-300"
                >
                  Tidak ada pesanan
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => {
                const isDelivery = order.method === 'delivery';
                const methodLabel = isDelivery ? 'Antar' : 'Ambil';

                return (
                  <tr key={order.order_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 border-b border-gray-300">{order.order_id}</td>
                    <td className="px-4 py-3 border-b border-gray-300">{order.shop_name}</td>
                    <td className="px-4 py-3 border-b border-gray-300">
                      {new Date(order.order_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300">
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.order_id, e.target.value)}
                          className="bg-white border border-gray-300 rounded-xs px-4 py-2 pr-8 text-sm md:text-base appearance-none w-full"
                        >
                          {isDelivery ? (
                            <>
                              <option value="pending">Batal</option>
                              <option value="processing">Dikemas</option>
                              <option value="shipped">Diantar</option>
                              <option value="delivered">Diterima</option>
                            </>
                          ) : (
                            <>
                              <option value="pending">Batal</option>
                              <option value="processing">Dikemas</option>
                              <option value="picked_up">Diambil</option>
                            </>
                          )}
                        </select>
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300">
                      Rp {order.total_price.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 border-b border-gray-300 font-bold ${isDelivery ? 'text-blue-800' : 'text-blue-600'}`}>
                      {methodLabel}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300 w-[200px]">
                      {order.location}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300">
                      <button
                        onClick={() => openModal(order)}
                        className="text-white text-xs w-8 h-8 rounded-xs bg-blue-800 hover:bg-blue-900 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
          <div className="bg-white rounded-lg max-w-md md:max-w-3xl w-full max-h-[90vh] overflow-y-auto relative p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-semibold">Detail Item Pesanan #{selectedOrder.order_id}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <ul className="list-disc list-inside space-y-2 text-sm md:text-base max-h-[60vh] overflow-y-auto">
              {selectedOrder.items.length > 0 ? (
                selectedOrder.items.map((item) => (
                  <li className="flex items-center" key={item.order_item_id}>
                    <span className="bg-blue-800 text-white rounded w-6 h-6 flex items-center justify-center text-xs mr-2">
                      {item.quantity}
                    </span>
                    <span className="truncate max-w-[70%]">
                      {item.product_name} {item.type} Tebal {item.thick} mm {item.avg_weight_per_stick} kg
                    </span>
                    <span className="font-bold ml-auto whitespace-nowrap">
                      Rp {item.subtotal.toLocaleString()}
                    </span>
                  </li>
                ))
              ) : (
                <li>(Tidak ada item)</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
