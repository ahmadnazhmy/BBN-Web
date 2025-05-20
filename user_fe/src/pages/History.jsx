import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import Nav from '../components/Nav';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch('https://bbn-web-production.up.railway.app/api/user/history', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json();
        if (res.ok) {
          if (Array.isArray(result)) {
            setHistory(result);
          } else {
            setError('Format data tidak sesuai dari server');
          }
        } else {
          setError(result.message || 'Gagal mengambil riwayat');
        }
      } catch {
        setError('Gagal mengambil data riwayat');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, navigate]);

  const translateOrderStatus = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'Belum Bayar';
      case 'processing': return 'Sedang Dikemas';
      case 'shipped': return 'Sedang Diantar';
      case 'delivered': return 'Sudah Diterima';
      case 'picked_up': return 'Sudah Diambil';
      case 'cancel': return 'Dibatalkan';
      default: return status;
    }
  };

  const translatePaymentStatus = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'Sedang Verifikasi';
      case 'completed': return 'Pembayaran Berhasil';
      case 'failed': return 'Pembayaran Gagal';
      default: return 'Belum Bayar';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div>
      <Nav />
      <div className="p-4 md:px-24 md:py-12">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center md:text-left">
          Riwayat Pesanan & Pembayaran
        </h2>

        {history.length === 0 ? (
          <p className="text-gray-500 text-center">Belum ada riwayat pesanan.</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => {
              const paymentStatus = (entry.payment_status || '').toLowerCase();
              const orderStatus = (entry.order_status || '').toLowerCase();

              return (
                <div
                  key={entry.order_id}
                  className="bg-white border border-gray-300 rounded-md shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between"
                >
                  <div className="mb-2 md:mb-0 md:flex md:gap-6 md:items-center">
                    <div>
                      <span className="font-semibold">Tanggal:</span>{' '}
                      {entry.order_date
                        ? new Date(entry.order_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </div>

                    <div>
                      <span className="font-semibold">Status Pesanan:</span>{' '}
                      {translateOrderStatus(entry.order_status)}
                    </div>

                    <div>
                      <span className="font-semibold">Status Pembayaran:</span>{' '}
                      {translatePaymentStatus(entry.payment_status)}
                    </div>

                    <div>
                      <span className="font-semibold">Total:</span>{' '}
                      Rp {entry.total_price.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() =>
                        setSelectedItems({ items: entry.items, proof: entry.proof_of_payment })
                      }
                      className="text-sm text-white bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded"
                    >
                      Lihat Item
                    </button>

                    {paymentStatus === 'failed' && (
                      <button
                        onClick={() => navigate(`/payment/retry/${entry.order_id}`)}
                        className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                      >
                        Bayar Ulang
                      </button>
                    )}

                    {orderStatus === 'pending' && (
                      <button
                        onClick={() => navigate(`/payment?order_id=${entry.order_id}`)}
                        className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                      >
                        Selesaikan Pembayaran
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedItems && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
            <div className="bg-white rounded-lg max-w-md md:max-w-3xl w-full max-h-[90vh] overflow-y-auto relative p-6">
              <h3 className="text-lg md:text-xl font-semibold mb-4">Detail Item Pesanan</h3>
              <ul className="list-disc list-inside space-y-2 max-h-[60vh] overflow-y-auto">
                {selectedItems.items.length > 0 ? (
                  selectedItems.items.map((item) => (
                    <li className="flex items-center" key={item.order_item_id}>
                      <span className="bg-blue-800 text-white rounded w-6 h-6 flex items-center justify-center text-xs mr-2">
                        {item.quantity}
                      </span>
                      <span className="truncate max-w-[70%]">
                        {item.product_name} {item.type} Tebal {item.thick} {item.avg_weight_per_stick}
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

              {selectedItems.proof && (
                <div className="mt-6">
                  <a
                    href={`https://bbn-web-production.up.railway.app${selectedItems.proof}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-900 text-sm text-center"
                  >
                    Lihat Bukti Pembayaran
                  </a>
                </div>
              )}

              <button
                onClick={() => setSelectedItems(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
