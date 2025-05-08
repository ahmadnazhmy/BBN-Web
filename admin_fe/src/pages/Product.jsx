import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

function Product() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    type: '',
    thick: '',
    avg_weight_per_stick: '',
    unit_price: '',
    stock: ''
  });
  const [message, setMessage] = useState(null); 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/product');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError('Error fetching products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    setEditData(product);
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        product_name: '',
        type: '',
        thick: '',
        avg_weight_per_stick: '',
        unit_price: '',
        stock: ''
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
      ? `http://localhost:5000/api/product/${editData.product_id}`
      : 'http://localhost:5000/api/product';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Gagal menyimpan data produk');

      const updatedProduct = await res.json();

      if (editData) {
        setProducts(products.map(p => p.product_id === updatedProduct.product_id ? updatedProduct : p));
      } else {
        setProducts([...products, updatedProduct]);
      }

      setMessage(editData ? 'Produk berhasil diedit' : 'Produk berhasil ditambahkan');
      setTimeout(() => setMessage(null), 3000); 
      closeModal();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/product/${productId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setProducts(products.filter(p => p.product_id !== productId));
          setMessage('Produk berhasil dihapus');
          setTimeout(() => setMessage(null), 3000);
        } else {
          alert('Gagal menghapus produk');
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
        <h1 className="text-xl font-bold py-2">Daftar Produk</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-800 hover:bg-blue-900 text-white text-sm px-4 py-2 rounded-xs"
        >
          <FontAwesomeIcon icon={faPlus} /> Tambah Produk
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
                <th className="px-4 py-3 border-b border-gray-300 text-left w-[200px]">Tipe</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">Tebal</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">Rata-rata Berat/Batang</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">Harga Satuan</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">Stok</th>
                <th className="px-4 py-3 border-b border-gray-300 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b border-gray-300">{index + 1}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{product.product_name}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{product.type}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{product.thick}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{product.avg_weight_per_stick} Kg</td>
                  <td className="px-4 py-3 border-b border-gray-300">Rp {product.unit_price.toLocaleString()}</td>
                  <td className="px-4 py-3 border-b border-gray-300">{product.stock}</td>
                  <td className="px-4 py-3 border-b border-gray-300">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(product)}
                        className="text-white text-xs w-8 h-8 rounded-xs bg-blue-800 hover:bg-blue-900 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.product_id)}
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
            <h2 className="text-xl font-bold mb-4">{editData ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="product_name" value={formData.product_name} onChange={handleChange} className="w-full border px-3 py-2 rounded-xs" placeholder="Nama Produk" required />
              <input name="type" value={formData.type} onChange={handleChange} className="w-full border px-3 py-2 rounded-xsrounded-xs" placeholder="Tipe" />
              <input name="thick" value={formData.thick} onChange={handleChange} className="w-full border px-3 py-2 rounded-xs" placeholder="Tebal" />
              <input name="avg_weight_per_stick" value={formData.avg_weight_per_stick} onChange={handleChange} className="w-full border px-3 py-2 rounded-xs" placeholder="Rata-rata Berat/Batang" />
              <input name="unit_price" value={formData.unit_price} onChange={handleChange} className="w-full border px-3 py-2 rounded-xsrounded-xs" placeholder="Harga Satuan" required />
              <input name="stock" value={formData.stock} onChange={handleChange} className="w-full border px-3 py-2 rounded-xs" placeholder="Stok" required />
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

export default Product;
