import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function Payment() {
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [file, setFile] = useState(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const token = localStorage.getItem('token')

  const queryParams = new URLSearchParams(location.search)
  const orderId = queryParams.get('order_id')
  const paymentSuccess = queryParams.get('payment_success') === 'true'

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    if (paymentSuccess) {
      setSuccessMessage('Pembayaran berhasil! Terima kasih.')
    }

    if (!orderId) {
      setError('Order ID tidak ditemukan di URL.')
      return
    }

    const fetchOrder = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`https://bbn-web-production.up.railway.app/api/order/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`HTTP ${res.status}: ${text}`)
        }

        const data = await res.json()
        setOrder(data)
        setAmount(data.total_price)
      } catch (err) {
        setError('Gagal ambil data order: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, token, navigate, paymentSuccess])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      alert('Pilih file bukti pembayaran terlebih dahulu')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB')
      return
    }

    const formData = new FormData()
    formData.append('proof', file)
    formData.append('order_id', orderId)
    formData.append('amount', amount)

    try {
      const res = await fetch('https://bbn-web-production.up.railway.app/api/upload-proof', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upload gagal')
      alert('Bukti pembayaran berhasil diunggah!')
      navigate('/')
    } catch (err) {
      alert(err.message || 'Gagal mengunggah bukti pembayaran')
    }
  }

  const handleCancelPayment = async () => {
    if (!window.confirm('Apakah kamu yakin ingin membatalkan pembayaran ini?')) return

    try {
      const res = await fetch(`https://bbn-web-production.up.railway.app/api/order/${orderId}/cancel-payment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal membatalkan pembayaran')

      alert('Pembayaran berhasil dibatalkan')
      navigate('/')
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan saat membatalkan')
    }
  }

  if (loading) return <div className="p-6">Memuat data order...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!order) return null

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl bg-white border border-gray-300 shadow-md rounded-xs p-6">
        <div className="w-full md:w-2/3 space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-center md:text-left">Pembayaran</h2>

          {successMessage && (
            <div className="p-3 mb-4 bg-green-200 text-green-800 rounded">{successMessage}</div>
          )}

          <table className="w-full">
            <tbody>
              <tr>
                <td className="font-bold align-top pr-4">Alamat</td>
                <td className="align-top">{order.location}</td>
              </tr>
              <tr>
                <td className="font-bold align-top pr-4">Tanggal</td>
                <td className="align-top">{formatDate(order.order_date)}</td>
              </tr>
              <tr>
                <td className="font-bold align-top pr-4">No. Rekening</td>
                <td className="align-top">Bank Mandiri 1670006211527</td>
              </tr>
            </tbody>
          </table>

          {(!order.payment || order.payment.status === 'pending') && (
            <form onSubmit={handleUpload} className="space-y-4 pt-4">
              <div>
                <label className="block mb-1 font-bold">Upload Bukti Pembayaran</label>
                <div className="flex items-center space-x-4">
                  <label
                    htmlFor="upload"
                    className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-xs cursor-pointer"
                  >
                    Pilih File
                  </label>
                  <span className="text-sm text-gray-600">
                    {file ? file.name : 'Belum ada file dipilih'}
                  </span>
                </div>
                <input
                  id="upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-xs"
              >
                Upload Bukti Pembayaran
              </button>
              <p
                onClick={handleCancelPayment}
                className="text-red-600 text-center underline cursor-pointer"
              >
                Batal bayar
              </p>
            </form>
          )}
        </div>

        <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200 pl-0 md:pl-6 pt-4 md:pt-0">
          <p className="font-bold mb-3">Daftar Barang</p>
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
            {order.items?.map((item, index) => (
              <li
                key={`${item.product_id}-${index}`}
                className="flex justify-between border-b pb-2 text-sm"
              >
                <span className="flex items-center gap-x-2">
                  <span className="bg-blue-800 text-white rounded-xs w-6 h-6 flex items-center justify-center text-xs">
                    {item.quantity}
                  </span>
                  <span>
                    {item.product_name}
                    {item.type ? ` ${item.type}` : ''}
                    {item.thick ? ` Tebal ${item.thick}` : ''}
                    {item.avg_weight_per_stick ? ` ${item.avg_weight_per_stick} Kg` : ''}
                  </span>
                </span>
                <span className="flex items-center">Rp{item.subtotal.toLocaleString()}</span>
              </li>
            ))}
          </ul>

          <div className="text-right mt-4 font-bold text-lg">
            Total: Rp{order.total_price.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
