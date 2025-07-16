// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Secret key untuk JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Ambil token dari header

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    // Menyimpan decoded data (id, nip_nis, role) di request untuk digunakan pada route
    req.user = decoded;
    next();
  });
};
