  const jwt = require('jsonwebtoken');

  const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
  
    const token = authHeader.split(' ')[1];
  
    jwt.verify(token, 'RAHASIA', (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token tidak valid' });
      }
  
      if (!decoded.id) {
        return res.status(400).json({ message: 'Token tidak menyertakan ID pengguna' });
      }
  
      req.user = decoded;
      next();
    });
  };  

  const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, 'RAHASIA', (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token tidak valid' });
      }

      if (!decoded.id || !decoded.admin_id) { 
        return res.status(403).json({ message: 'Access Denied. Admins only.' });
      }

      req.admin = decoded;  
      next();
    });
  };

  module.exports = { authenticate, authenticateAdmin };
