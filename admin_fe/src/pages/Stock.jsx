import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

function Stock() {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    date: '',
    quantity: '',
    type: 'in' // default "in"
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stock');
        if (!res.ok) throw new Error('Failed to fetch stock data');
        const data = await res.json();
        setStocks(data);
      } catch (err) {
        console.error(err);
        setError('Error fetching stock data');
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/product');
        if (!res.ok) throw new Error('Failed to fetch product data');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStocks(), fetchProducts()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const openModal = (stock = null) => {
    setEditData(stock);
    if (stock) {
      setFormData({
        product_id: stock.product_id,
        date: stock.date ? stock.date.split('T')[0] : '', // format yyyy-mm-dd
        quantity: stock.quantity,
        type: stock.type
      });
    } else {
      setFormData({
        product_id: '',
        date: '',
        quantity: '',
        type: 'in'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditData(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editData ? 'PUT' : 'POST';
    const url = editData
      ? `http://localhost:5000/api/stock/${editData.stock_id}`
      : 'http://localhost:5000/api/stock';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Gagal menyimpan data stok');

      const updatedStock = await res.json();

      if (editData) {
        setStocks(stocks.map(s => s.stock_id === updatedStock.stock_id ? updatedStock : s));
      } else {
        setStocks([...stocks, updatedStock]);
      }

      setMessage(editData ? 'Data stok berhasil diedit' : 'Data stok berhasil ditambahkan');
      setTimeout(() => setMessage(null), 3000);
      closeModal();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async (stockId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data stok ini?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/stock/${stockId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setStocks(stocks.filter(s => s.stock_id !== stockId));
          setMessage('Data stok berhasil dihapus');
          setTimeout(() => setMessage(null), 3000);
        } else {
          alert('Gagal menghapus data stok');
        }
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat menghapus');
      }
    }
  };

  if (loading) return <div className="p-6">Memuat...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 md:px-6 md:py-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold py-2">Riwayat Stok</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-800 hover:bg-blue-900 text-white text-sm px-4 py-2 rounded-xs"
        >
          <FontAwesomeIcon icon={faPlus} /> Tambah Data Stok
        </button>
      </div>

      {message && <div className="mb-4 text-blue-800 bg-blue-100 px-4 py-2 rounded-xs">{message}</div>}

      <div className="overflow-hidden bg-white rounded-xs">
        <div className="max-h-[85vh] overflow-y-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b border-gray-300 text-left">No</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left w-[200px]">Nama Produk</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left w-[140px]">Tanggal</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">Jumlah</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left w-[100px]">Tipe</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => (
                <tr key={stock.stock_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b border-gray-300">{index + 1}</td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    {products.find(p => p.product_id === stock.product_id)?.product_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-300">{stock.date ? new Date(stock.date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{stock.quantity}</td>
                  <td className="px-4 py-3 border-b border-gray-300 capitalize">{stock.type}</td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(stock)}
                        className="text-white text-xs w-8 h-8 rounded-xs bg-blue-800 hover:bg-blue-900 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        onClick={() => handleDelete(stock.stock_id)}
                        className="text-white text-xs w-8 h-8 rounded-xs bg-red-600 hover:bg-red-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 modal-overlay">
          <div className="bg-white p-6 rounded-xs shadow-md w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editData ? 'Edit Data Stok' : 'Tambah Data Stok'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                required
              >
                <option value="">Pilih Produk</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} {p.type}, Tebal {p.thick}, {p.avg_weight_per_stick} Kg
                  </option>
                ))}
              </select>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                required
              />

              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Jumlah"
                required
              />

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-black"
                required
              >
                <option value="in">Masuk</option>
                <option value="out">Keluar</option>
              </select>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded-xs">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-800 text-white rounded-xs">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stock;
