import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import User from './pages/User';
import Login from './pages/Login';
import Register from './pages/Register';
import Product from './pages/Product';
import Order from './pages/Order';
import Payment from './pages/Payment';
import Dashboard from './pages/Dashboard';
import Invoice from './pages/Invoice';
import Sidebar from './components/Side';

function AppContent() {
  const location = useLocation();
  const hideSidebarOnPaths = ['/', '/admin/register'];
  const hideSidebar = hideSidebarOnPaths.includes(location.pathname);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen overflow-y-hidden">
      {!hideSidebar && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      <main
        className={`w-full transition-all duration-300 ease-in-out ${
          !hideSidebar
            ? isSidebarOpen
              ? 'ml-80'
              : 'ml-20'
            : ''
        }`}
      >
        {!hideSidebar && (
          <button
            onClick={toggleSidebar}
            className={`fixed top-4 z-30 p-2 rounded-md bg-blue-700 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out
              ${isSidebarOpen ? 'left-72' : 'left-12'}`} 
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen ? '❮' : '❯'}
          </button>
        )}

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user" element={<User />} />
          <Route path="/product" element={<Product />} />
          <Route path="/order" element={<Order />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/invoice" element={<Invoice />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;