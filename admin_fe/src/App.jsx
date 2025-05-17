import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import User from './pages/User';
import Login from './pages/Login';
import Register from './pages/Register';
import Product from './pages/Product';
import Order from './pages/Order';
import Payment from './pages/Payment';
import Dashboard from './pages/Dashboard'; 
import Stock from './pages/Stock';
import Sidebar from './components/Side'; 

function App() {
  const location = useLocation();
  const hideSidebar = location.pathname === '/' || location.pathname === '/admin/register';

  return (
    <div className="flex min-h-screen">
      {!hideSidebar && <Sidebar />}
      <main className={`w-full ${!hideSidebar ? 'ml-80' : ''}`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user" element={<User />} />
          <Route path="/product" element={<Product />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/order" element={<Order />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </main>
    </div>
  );
}

function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter;
