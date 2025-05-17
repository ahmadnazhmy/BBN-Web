import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EditProfile from './pages/EditProfile';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import History from './pages/History';
import Notification from './pages/Notification';
import RetryPayment from './pages/RetryPayment';
import Company from './pages/Company';

function App() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/retry/:orderId" element={<RetryPayment />} />
        <Route path="/history" element={<History />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="/company" element={<Company />} /> 
      </Routes>
    </Router>
  );
}

export default App;
