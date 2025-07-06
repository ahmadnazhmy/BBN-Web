import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash, faEye, faChevronDown, faXmark, faSearch } from '@fortawesome/free-solid-svg-icons';
import API_BASE_URL from '../api';

function Product() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [animateProductModal, setAnimateProductModal] = useState(false);
  const [formData, setFormData] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [stockHistory, setStockHistory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [animateStockModal, setAnimateStockModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const showNotification = useCallback((msg, type = 'success', duration = 3000) => {
    setNotification({ message: msg, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, duration);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/product`);
        if (!res.ok) throw new Error('Gagal mengambil data produk');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError('Terjadi kesalahan saat memuat produk');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setFormData({
        product_id: product.product_id,
        product_name: product.product_name,
        type: product.type,
        thick: product.thick !== null ? String(product.thick) : '',
        avg_weight_per_stick: product.avg_weight_per_stick !== null ? String(product.avg_weight_per_stick) : '',
        unit_price: product.unit_price !== null ? String(product.unit_price) : '',
        stock_change: '',
        current_stock_for_correction: product.stock || 0,
        stock_note_source: ''
      });
    } else {
      setFormData({
        product_name: '',
        type: '',
        thick: '',
        avg_weight_per_stick: '',
        unit_price: '',
        initial_stock: '',
        stock_change: '',
        stock_note_source: ''
      });
    }
    setShowModal(true);
    setTimeout(() => {
      setAnimateProductModal(true);
    }, 50);
  };

  const closeModal = () => {
    setAnimateProductModal(false);
    setTimeout(() => {
      setShowModal(false);
      setFormData(null);
    }, 300);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!formData.product_id;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit
      ? `${API_BASE_URL}/product/${formData.product_id}`
      : `${API_BASE_URL}/product`;

    const parseNumberOrNull = (value) => {
      if (value === '' || value === null || value === undefined) return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const payload = {
      product_name: formData.product_name,
      type: formData.type,
      thick: formData.thick === '' ? null : formData.thick,
      avg_weight_per_stick: formData.avg_weight_per_stick === '' ? null : formData.avg_weight_per_stick,
      unit_price: parseNumberOrNull(formData.unit_price),
    };

    if (isEdit) {
      if (formData.stock_note_source) {
        const stockChangeValue = parseNumberOrNull(formData.stock_change);

        if (formData.stock_note_source === 'correction') {
          if (stockChangeValue !== null && stockChangeValue < 0) {
            showNotification('Stok setelah koreksi tidak boleh kurang dari 0.', 'error');
            return;
          }
          const desiredFinalStock = stockChangeValue || 0;
          const actualStockChange = desiredFinalStock - formData.current_stock_for_correction;
          payload.stock_change = actualStockChange;

        } else {
          if (stockChangeValue !== null && stockChangeValue < 0) {
            const amountOut = Math.abs(stockChangeValue);
            if (formData.current_stock_for_correction < amountOut) {
              showNotification(`Jumlah keluar (${amountOut}) melebihi stok yang tersedia (${formData.current_stock_for_correction}).`, 'error');
              return;
            }
          }
          payload.stock_change = stockChangeValue || 0;
        }
        payload.stock_note_source = formData.stock_note_source;
      }
    } else {
      payload.initial_stock = 0;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menyimpan data produk');
      }
      const updatedProduct = await res.json();

      if (isEdit) {
        setProducts(products.map(p => p.product_id === updatedProduct.product_id ? updatedProduct : p));
      } else {
        setProducts([...products, updatedProduct]);
      }

      showNotification(isEdit ? 'Produk berhasil diedit' : 'Produk berhasil ditambahkan', 'success');
      closeModal();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini? (Ini juga akan menghapus riwayat stoknya)')) {
      try {
        const res = await fetch(`${API_BASE_URL}/product/${productId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal menghapus produk');
        }
        setProducts(products.filter(p => p.product_id !== productId));
        showNotification('Produk berhasil dihapus', 'success');
      } catch (err) {
        showNotification('Terjadi kesalahan saat menghapus: ' + err.message, 'error');
      }
    }
  };

  const openStockHistory = async (product) => {
    try {
      const res = await fetch(`${API_BASE_URL}/stock/product/${product.product_id}`);
      if (!res.ok) throw new Error('Gagal mengambil riwayat stok');
      const data = await res.json();
      setStockHistory(data);
      setSelectedProduct(product);
      setShowStockModal(true);
      setTimeout(() => {
        setAnimateStockModal(true);
      }, 50);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const closeStockModal = () => {
    setAnimateStockModal(false);
    setTimeout(() => {
      setShowStockModal(false);
      setSelectedProduct(null);
      setStockHistory([]);
    }, 300);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const filteredProducts = products.filter(product => {
    const productName = `${product.product_name || ''} ${product.type || ''} ${product.thick !== null ? product.thick + ' mm' : ''} ${product.avg_weight_per_stick !== null ? product.avg_weight_per_stick + ' Kg' : ''}`;
    const escapedSearchTerm = escapeRegExp(searchTerm);
    const regex = new RegExp(escapedSearchTerm, 'i');

    return regex.test(productName);
  });

  if (loading) return <div className="p-6 text-center text-lg">Memuat data produk...</div>;
  if (error) return <div className="p-6 text-center text-red-500 text-lg">Error: {error}</div>;

  return (
    <div className="px-6 pt-6 flex flex-col h-full bg-gray-50">
      <div className="p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Daftar Produk</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Cari nama produk..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors shadow w-full md:w-auto"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" /> Tambah Produk
            </button>
          </div>
        </div>
        {notification.message && (
          <div className={`mt-4 px-4 py-2 rounded-md text-sm ${
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
                <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-[600px]">Nama Produk</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Harga Satuan</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Stok</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr key={product.product_id} className="border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{product.product_name} {product.type} Tebal {product.thick} mm {product.avg_weight_per_stick} Kg</td>
                    <td className="px-4 py-3 font-bold text-gray-900">Rp {product.unit_price.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">{product.stock || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(product)}
                          className="text-white w-8 h-8 rounded-full bg-yellow-600 hover:bg-yellow-700 transition-colors shadow-md flex items-center justify-center"
                          title="Edit Produk"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.product_id)}
                          className="text-white w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 transition-colors shadow-md flex items-center justify-center"
                          title="Hapus Produk"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        <button
                          onClick={() => openStockHistory(product)}
                          className="text-white w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
                          title="Riwayat Stok"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && formData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
          <div
            className={`
              bg-white rounded-lg shadow-xl max-w-lg w-full relative p-6
              transition-all duration-300 ease-out transform
              ${animateProductModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                {formData.product_id ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 transition-colors">
                <FontAwesomeIcon icon={faXmark} className='text-xl md:text-3xl' />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <div className="relative">
                  <select
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    required
                  >
                    <option value="" disabled>Pilih Kategori Produk</option>
                    <option value="CNP (Kanal C)">CNP (Kanal C)</option>
                    <option value="Reng">Reng</option>
                    <option value="Spandek">Spandek</option>
                    <option value="Bondek">Bondek</option>
                    <option value="Flatseat">Flatseat</option>
                    <option value="Nok C">Nok C</option>
                    <option value="Hollow">Hollow</option>
                    <option value="Genteng Metal">Genteng Metal</option>
                    <option value="Talang Juray">Talang Juray</option>
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <input
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Polos / Ulir"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tebal (mm)</label>
                <input
                  type="text"
                  min="0"
                  name="thick"
                  value={formData.thick}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rata-rata Berat per Batang (kg)</label>
                <input
                  type="text"
                  step="0.01"
                  min="0"
                  name="avg_weight_per_stick"
                  value={formData.avg_weight_per_stick}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 5.2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan (Rp)</label>
                <input
                  type="text"
                  min="0"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 15000"
                  required
                />
              </div>

              {!formData.product_id ? (
                null
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Stok</label>
                    <div className="relative">
                      <select
                        name="stock_note_source"
                        value={formData.stock_note_source}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                        required={!!formData.stock_change && formData.stock_change !== ''}
                      >
                        <option value="" disabled>Pilih Sumber</option>
                        <option value="production">Produksi</option>
                        <option value="correction">Koreksi</option>
                      </select>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.stock_note_source === 'correction' ? 'Stok Setelah Koreksi' : 'Jumlah Perubahan Stok'}
                    </label>
                    <input
                      type="number"
                      name="stock_change"
                      value={formData.stock_change}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={formData.stock_note_source === 'correction' ? "Stok akhir yang diinginkan" : "Jumlah masuk (positif) / keluar (negatif)"}
                      required={!!formData.stock_note_source && formData.stock_note_source !== ''}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 p-4">
          <div
            className={`
              bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6
              transition-all duration-300 ease-out transform
              ${animateStockModal ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
          >
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                Riwayat Stok: {selectedProduct?.product_name}
              </h3>
              <button onClick={closeStockModal} className="text-gray-500 hover:text-gray-800 transition-colors">
                <FontAwesomeIcon icon={faXmark} className='text-xl md:text-3xl' />
              </button>
            </div>

            <p className="mb-4 text-gray-700 text-base">
              {selectedProduct?.product_name} {selectedProduct?.type} Tebal {selectedProduct?.thick} mm {selectedProduct?.avg_weight_per_stick} kg
            </p>

            {stockHistory.length > 0 ? (
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm text-gray-700">
                  <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipe Mutasi</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Perubahan Stok</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="px-4 py-3">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {item.type === 'in' ? 'Masuk' : item.type === 'out' ? 'Keluar' : 'Koreksi'}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {item.type === 'correction'
                            ? item.quantity_change
                            : item.type === 'in'
                              ? `+${item.quantity}`
                              : `-${item.quantity}`
                          }
                        </td>
                        <td className="px-4 py-3">{item.source || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">(Belum ada riwayat stok)</p>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={closeStockModal} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Product;