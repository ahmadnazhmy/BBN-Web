import React, { useEffect, useState, useRef } from 'react';

const Notification = ({ isOpen, setIsOpen }) => {
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://bbn-web.up.railway.app/api/notification', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Gagal ambil notifikasi:', err);
    }
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`http://bbn-web.up.railway.app/api/notification/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif))
      );
    } catch (err) {
      console.error('Gagal tandai notifikasi:', err);
    }
  };

  const confirmDelivery = async (notif) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://bbn-web.up.railway.app/api/order/${notif.order_id}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Gagal konfirmasi pengiriman');

      alert('Konfirmasi barang sampai berhasil!');
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_confirmed: true } : n))
      );
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  const deleteAllNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!window.confirm('Yakin mau hapus semua notifikasi?')) return;

    try {
      const res = await fetch('http://bbn-web.up.railway.app/api/notification', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal hapus semua notifikasi');

      setNotifications([]);
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="
        fixed right-0 mt-2 md:absolute
        w-full max-w-md min-w-[240px]
        max-h-[60vh] overflow-y-auto 
        bg-white border border-gray-200 shadow-md rounded-xs z-50 text-left
        md:w-80 md:right-0 md:left-auto
      "
    >
      {notifications.length === 0 ? (
        <div className="p-4 text-gray-500 text-sm text-center">Tidak ada notifikasi</div>
      ) : (
        <>
          <div className="flex justify-between items-center p-4">
            <span className="font-semibold text-sm md:text-base">Notifikasi</span>
            <button
              onClick={deleteAllNotifications}
              className="text-red-600 text-xs md:text-sm hover:underline"
            >
              Hapus Semua
            </button>
          </div>
          <ul className="divide-y">
            {notifications.map((notif) => (
              <li key={notif.id} className="p-4 hover:bg-gray-100">
                <div className={`${notif.is_read ? 'text-gray-500' : 'font-semibold'} text-sm md:text-base`}>
                  {notif.message}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleString()}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="text-blue-600 text-xs md:text-sm hover:underline"
                    >
                      Tandai dibaca
                    </button>
                  )}
                  {notif.message?.includes('sedang diantar') && !notif.is_confirmed && (
                    <button
                      onClick={() => confirmDelivery(notif)}
                      className="bg-blue-800 hover:bg-blue-900 text-white text-xs md:text-sm rounded-xs p-2"
                    >
                      Konfirmasi Barang Sampai
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Notification;
