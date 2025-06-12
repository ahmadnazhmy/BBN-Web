import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

const Notification = ({ isOpen, setIsOpen, notificationButtonRef, setParentNotificationCount }) => {
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('https://bbn-web-production.up.railway.app/api/notification', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data);
      const unreadCount = data.filter(notif => !notif.is_read).length;
      setParentNotificationCount(unreadCount);

    } catch (err) {
      console.error('Gagal ambil notifikasi:', err);
      setParentNotificationCount(0);
    }
  };

  const markAsRead = async (notificationId, event) => {
    event.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!notificationId) {
      console.error("Error: Notification ID is missing for markAsRead.");
      alert("Gagal menandai notifikasi sebagai dibaca: ID notifikasi tidak ditemukan.");
      return;
    }

    try {
      const res = await fetch(`https://bbn-web-production.up.railway.app/api/notification/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal menandai notifikasi sebagai dibaca');
      }

      setNotifications((prev) => {
        const updatedNotifs = prev.map((notif) =>
          notif.notification_id === notificationId ? { ...notif, is_read: true } : notif
        );
        const newUnreadCount = updatedNotifs.filter(notif => !notif.is_read).length;
        setParentNotificationCount(newUnreadCount);
        return updatedNotifs;
      });

    } catch (err) {
      console.error('Gagal tandai notifikasi:', err);
      alert(err.message || 'Gagal menandai notifikasi sebagai dibaca.');
    }
  };

  const confirmDelivery = async (notif, event) => {
    event.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!notif.order_id) {
        console.error("Error: Order ID is missing for confirmDelivery on notification:", notif);
        alert("Gagal konfirmasi pengiriman: ID pesanan tidak ditemukan.");
        return;
    }

    try {
      const res = await fetch(`https://bbn-web-production.up.railway.app/api/order/${notif.order_id}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal konfirmasi pengiriman');
      }

      alert('Konfirmasi barang sampai berhasil!');
      setNotifications((prev) => {
        const updatedNotifs = prev.map((n) =>
          n.notification_id === notif.notification_id ? { ...n, is_confirmed: true, is_read: true } : n
        );
        const newUnreadCount = updatedNotifs.filter(notif => !notif.is_read).length;
        setParentNotificationCount(newUnreadCount);
        return updatedNotifs;
      });

    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  const deleteAllNotifications = async (event) => {
    event.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!window.confirm('Yakin mau hapus semua notifikasi?')) return;

    try {
      const res = await fetch('https://bbn-web-production.up.railway.app/api/notification', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Gagal hapus semua notifikasi');
      }

      setNotifications([]);
      setParentNotificationCount(0);
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
        fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="
        fixed top-16 right-4
        w-[calc(100vw-32px)] max-w-md min-w-[240px]
        max-h-[70vh] overflow-y-auto
        bg-white border border-gray-200 shadow-lg rounded-lg z-50 text-left
        md:top-auto md:right-0 md:mt-2 md:w-96 md:left-auto
      "
    >
      {notifications.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
            <span className="font-bold text-lg">Notifikasi</span>
            <button
              onClick={() => setIsOpen(false)} 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Tutup notifikasi"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
          </div>
          <div className="p-4 text-gray-500 text-center">Tidak ada notifikasi baru.</div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
            <span className="font-bold text-lg">Notifikasi</span>
            <div className="flex items-center gap-2">
              <button
                onClick={deleteAllNotifications}
                className="text-red-600 text-sm hover:text-red-800 transition-colors duration-200"
              >
                Hapus Semua
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                aria-label="Tutup notifikasi"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {notifications.map((notif) => (
              <li
                key={notif.notification_id}
                className={`p-4 ${notif.is_read ? 'bg-white text-gray-600' : 'bg-blue-50 text-gray-800'} hover:bg-gray-100 transition-colors duration-200`}
              >
                <div className={`${notif.is_read ? 'font-normal' : 'font-semibold'} text-base leading-snug`}>
                  {notif.message}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleString('id-ID', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {!notif.is_read && (
                    <button
                      onClick={(e) => markAsRead(notif.notification_id, e)}
                      className="text-blue-700 text-sm hover:underline font-medium py-1 px-2"
                    >
                      Tandai sudah dibaca
                    </button>
                  )}
                  {notif.message?.includes('sedang diantar') && !notif.is_confirmed && (
                    <button
                      onClick={(e) => confirmDelivery(notif, e)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-md px-3 py-2 transition-colors duration-200"
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