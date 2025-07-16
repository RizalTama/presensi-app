// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user (admin/guru/siswa)
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nip_nis:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Login gagal
 */
// Login route
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/dashboard:
 *   get:
 *     summary: Mengakses dashboard sesuai dengan role pengguna
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Pesan selamat datang di dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to Siswa Dashboard
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       403:
 *         description: Akses ditolak
 */
// Dashboard route yang dilindungi berdasarkan role
router.get('/dashboard', verifyToken, (req, res) => {
  const userRole = req.user.role;

  // Redirect user ke dashboard sesuai role
  if (userRole === 'siswa') {
    res.json({ message: 'Welcome to Siswa Dashboard' });
  } else if (userRole === 'guru') {
    res.json({ message: 'Welcome to Guru Dashboard' });
  } else if (userRole === 'admin') {
    res.json({ message: 'Welcome to Admin Dashboard' });
  } else {
    res.status(403).json({ message: 'Access Denied' });
  }
});

module.exports = router;
