// controllers/authController.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Secret key untuk JWT (pastikan ini ada di file .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Fungsi untuk login
exports.login = (req, res) => {
  const { nip_nis, password } = req.body;

  // Pertama cek di tabel Admin
  const sqlAdmin = 'SELECT * FROM Admin WHERE nip = ?';
  db.query(sqlAdmin, [nip_nis], (err, resultsAdmin) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }

    if (resultsAdmin.length > 0) {
      // Jika data ditemukan di tabel Admin
      const admin = resultsAdmin[0];

      // Verifikasi password
      if (admin.password !== password) {
        return res.status(401).json({ message: 'Invalid NIP/NIS or password' });
      }

      // Membuat JWT token untuk admin
      const payload = {
        id: admin.id,
        nip_nis: admin.nip,
        role: 'admin', // Role admin
        nama_lengkap: admin.nama_lengkap, // Menambahkan nama lengkap admin
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      // Kirimkan token dan role admin, beserta nama lengkap dan ID
      return res.json({
        message: `Selamat datang, ${admin.nama_lengkap}`,
        token: token,
        role: 'admin',
        id: admin.id,
        nama_lengkap: admin.nama_lengkap
      });
    }

    // Jika data tidak ditemukan di tabel Admin, cek di tabel Guru
    const sqlGuru = 'SELECT * FROM Guru WHERE nip = ?';
    db.query(sqlGuru, [nip_nis], (err, resultsGuru) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error querying the database' });
      }

      if (resultsGuru.length > 0) {
        // Jika data ditemukan di tabel Guru (sebagai guru biasa)
        const guru = resultsGuru[0];

        // Verifikasi password
        if (guru.password !== password) {
          return res.status(401).json({ message: 'Invalid NIP/NIS or password' });
        }

        // Membuat JWT token untuk guru
        const payload = {
          id: guru.id,
          nip_nis: guru.nip,
          role: 'guru', // Role guru
          nama_lengkap: guru.nama_lengkap, // Menambahkan nama lengkap guru
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // Kirimkan token dan role guru, beserta nama lengkap dan ID
        return res.json({
          message: `Selamat datang, ${guru.nama_lengkap}`,
          token: token,
          role: 'guru',
          id: guru.id,
          nama_lengkap: guru.nama_lengkap
        });
      }

      // Jika data tidak ditemukan di tabel Admin dan Guru, cek di tabel Siswa
      const sqlSiswa = 'SELECT * FROM Siswa WHERE nis = ?';
      db.query(sqlSiswa, [nip_nis], (err, resultsSiswa) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error querying the database' });
        }

        if (resultsSiswa.length > 0) {
          // Jika data ditemukan di tabel Siswa
          const siswa = resultsSiswa[0];

          // Verifikasi password
          if (siswa.password !== password) {
            return res.status(401).json({ message: 'Invalid NIP/NIS or password' });
          }

          // Membuat JWT token untuk siswa
          const payload = {
            id: siswa.id,
            nis: siswa.nis,
            role: 'siswa', // Role siswa
            nama_lengkap: siswa.nama_lengkap, // Menambahkan nama lengkap siswa
          };

          const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

          // Kirimkan token dan role siswa, beserta nama lengkap dan ID
          return res.json({
            message: `Selamat datang, ${siswa.nama_lengkap}`,
            token: token,
            role: 'siswa',
            id: siswa.id,
            nama_lengkap: siswa.nama_lengkap
          });
        }

        // Jika data tidak ditemukan di ketiga tabel
        return res.status(401).json({ message: 'Invalid NIP/NIS or password' });
      });
    });
  });
};