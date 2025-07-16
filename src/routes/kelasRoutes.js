const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Kelas
 *   description: API untuk manajemen data kelas
 * components:
 *   schemas:
 *     Kelas:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nama_kelas:
 *           type: string
 *         guru_id:
 *           type: integer
 *         nama_guru:
 *           type: string
 *         waktu_mulai:
 *           type: string
 *           format: time
 *         waktu_selesai:
 *           type: string
 *           format: time
 *         ruangan:
 *           type: string
 *         jumlah_siswa:
 *           type: integer
 *     NewKelas:
 *       type: object
 *       required:
 *         - id
 *         - nama_kelas
 *         - guru_id
 *       properties:
 *         id:
 *           type: integer
 *         nama_kelas:
 *           type: string
 *         guru_id:
 *           type: integer
 *         waktu_mulai:
 *           type: string
 *           format: time
 *         waktu_selesai:
 *           type: string
 *           format: time
 *         ruangan:
 *           type: string
 *         jumlah_siswa:
 *           type: integer
 */

// GET Semua Kelas
/**
 * @swagger
 * /api/kelas:
 *   get:
 *     summary: Mengambil semua data kelas
 *     tags: [Kelas]
 *     responses:
 *       200:
 *         description: Daftar semua kelas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Kelas'
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/', (req, res) => {
  const sql = `
    SELECT k.id, k.nama_kelas, k.guru_id, k.waktu_mulai, k.waktu_selesai, k.ruangan, k.jumlah_siswa, g.nama_lengkap AS nama_guru
    FROM Kelas k
    JOIN Guru g ON k.guru_id = g.id
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    res.json(results);
  });
});

// GET Kelas berdasarkan ID
/**
 * @swagger
 * /api/kelas/{id}:
 *   get:
 *     summary: Mengambil data kelas berdasarkan ID
 *     tags: [Kelas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Data kelas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Kelas'
 *       404:
 *         description: Kelas tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'ID harus bertipe integer' });
  }

  const sql = `
    SELECT k.id, k.nama_kelas, k.guru_id, k.waktu_mulai, k.waktu_selesai, k.ruangan, k.jumlah_siswa, g.nama_lengkap AS nama_guru
    FROM Kelas k
    JOIN Guru g ON k.guru_id = g.id
    WHERE k.id = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Kelas not found' });
    }

    res.json(results[0]);
  });
});

// GET Kelas berdasarkan ID Guru
/**
 * @swagger
 * /api/kelas/guru/{guru_id}:
 *   get:
 *     summary: Mengambil semua data kelas berdasarkan ID Guru
 *     tags: [Kelas]
 *     parameters:
 *       - in: path
 *         name: guru_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Guru yang mengajar kelas
 *     responses:
 *       200:
 *         description: Daftar kelas yang diajar oleh guru berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Kelas'
 *       400:
 *         description: ID Guru tidak valid.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/guru/:guru_id', (req, res) => {
  const { guru_id } = req.params;

  // Validasi ID harus integer
  if (isNaN(guru_id) || !Number.isInteger(Number(guru_id))) {
    return res.status(400).json({ message: 'ID Guru harus berupa angka bulat.' });
  }

  const sql = `
    SELECT k.id, k.nama_kelas, k.guru_id, k.waktu_mulai, k.waktu_selesai, k.ruangan, k.jumlah_siswa, g.nama_lengkap AS nama_guru
    FROM Kelas k
    JOIN Guru g ON k.guru_id = g.id
    WHERE k.guru_id = ?
  `;

  db.query(sql, [guru_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    res.json(results);
  });
});

// GET Kelas berdasarkan ID Siswa
/**
 * @swagger
 * /api/kelas/siswa/{siswa_id}:
 *   get:
 *     summary: Mengambil data kelas berdasarkan ID Siswa
 *     tags: [Kelas]
 *     parameters:
 *       - in: path
 *         name: siswa_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Siswa yang terdaftar di kelas
 *     responses:
 *       200:
 *         description: Data kelas tempat siswa terdaftar berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Kelas'
 *       400:
 *         description: ID Siswa tidak valid.
 *       404:
 *         description: Siswa atau kelasnya tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/siswa/:siswa_id', (req, res) => {
  const { siswa_id } = req.params;

  // Validasi ID harus integer
  if (isNaN(siswa_id) || !Number.isInteger(Number(siswa_id))) {
    return res.status(400).json({ message: 'ID Siswa harus berupa angka bulat.' });
  }

  const sql = `
    SELECT 
      k.id, k.nama_kelas, k.guru_id, k.waktu_mulai, k.waktu_selesai, k.ruangan, k.jumlah_siswa, 
      g.nama_lengkap AS nama_guru
    FROM Kelas k
    JOIN Siswa s ON s.kelas_id = k.id
    JOIN Guru g ON k.guru_id = g.id
    WHERE s.id = ?
  `;

  db.query(sql, [siswa_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Kelas untuk siswa ini tidak ditemukan.' });
    }
    res.json(results[0]);
  });
});

// POST (Tambah Kelas)
/**
 * @swagger
 * /api/kelas:
 *   post:
 *     summary: Menambahkan kelas baru
 *     tags: [Kelas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewKelas'
 *     responses:
 *       201:
 *         description: Kelas berhasil ditambahkan.
 *       400:
 *         description: ID sudah terpakai.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/', (req, res) => {
  const { id, nama_kelas, guru_id, waktu_mulai, waktu_selesai, ruangan, jumlah_siswa } = req.body;

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'ID harus bertipe integer' });
  }

  // Cek apakah ID sudah terpakai
  const sqlCheckId = 'SELECT * FROM Kelas WHERE id = ?';
  db.query(sqlCheckId, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'ID sudah terpakai' });
    }

    const sql = 'INSERT INTO Kelas (id, nama_kelas, guru_id, waktu_mulai, waktu_selesai, ruangan, jumlah_siswa) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [id, nama_kelas, guru_id, waktu_mulai, waktu_selesai, ruangan, jumlah_siswa], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error adding kelas' });
      }

      // Mengambil data kelas yang baru ditambahkan
      const getKelasSql = 'SELECT k.id, k.nama_kelas, k.guru_id, k.waktu_mulai, k.waktu_selesai, k.ruangan, k.jumlah_siswa, g.nama_lengkap AS nama_guru FROM Kelas k JOIN Guru g ON k.guru_id = g.id WHERE k.id = ?';
      db.query(getKelasSql, [id], (err, kelasResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error retrieving kelas data' });
        }
        res.status(201).json({
          message: 'Kelas added successfully',
          kelas: kelasResults[0],
        });
      });
    });
  });
});

// PUT (Update Kelas)
/**
 * @swagger
 * /api/kelas/{id}:
 *   put:
 *     summary: Memperbarui data kelas
 *     tags: [Kelas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Kelas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_kelas:
 *                 type: string
 *               guru_id:
 *                 type: integer
 *               waktu_mulai:
 *                 type: string
 *                 format: time
 *               waktu_selesai:
 *                 type: string
 *                 format: time
 *               ruangan:
 *                 type: string
 *               jumlah_siswa:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Kelas berhasil diperbarui.
 *       404:
 *         description: Kelas tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'ID harus bertipe integer' });
  }

  const { nama_kelas, guru_id, waktu_mulai, waktu_selesai, ruangan, jumlah_siswa } = req.body;

  // Cek apakah ID sudah terpakai
  const sqlCheckId = 'SELECT * FROM Kelas WHERE id = ?';
  db.query(sqlCheckId, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Kelas not found' });
    }

    const sql = 'UPDATE Kelas SET nama_kelas = ?, guru_id = ?, waktu_mulai = ?, waktu_selesai = ?, ruangan = ?, jumlah_siswa = ? WHERE id = ?';
    db.query(sql, [nama_kelas, guru_id, waktu_mulai, waktu_selesai, ruangan, jumlah_siswa, id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error updating kelas' });
      }

      // Mengambil data kelas yang diperbarui
      const getKelasSql = 'SELECT k.id, k.nama_kelas, k.guru_id, k.waktu_mulai, k.waktu_selesai, k.ruangan, k.jumlah_siswa, g.nama_lengkap AS nama_guru FROM Kelas k JOIN Guru g ON k.guru_id = g.id WHERE k.id = ?';
      db.query(getKelasSql, [id], (err, kelasResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error retrieving updated kelas data' });
        }
        res.json({
          message: 'Kelas updated successfully',
          kelas: kelasResults[0],
        });
      });
    });
  });
});

// DELETE (Hapus Kelas)
/**
 * @swagger
 * /api/kelas/{id}:
 *   delete:
 *     summary: Menghapus data kelas
 *     tags: [Kelas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Kelas berhasil dihapus.
 *       404:
 *         description: Kelas tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Validasi ID harus integer (meskipun sudah ada middleware, ini untuk keamanan tambahan)
  if (isNaN(id) || !Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa angka bulat.' });
  }

  // Ambil data kelas sebelum dihapus
  const getKelasSql = `
    SELECT k.*, g.nama_lengkap AS nama_guru
    FROM Kelas k
    JOIN Guru g ON k.guru_id = g.id
    WHERE k.id = ?
  `;
  db.query(getKelasSql, [id], (err, kelasResults) => {
    if (err) {
      console.error('Error retrieving kelas data:', err);
      return res.status(500).json({ message: 'Gagal mengambil data kelas.', error: err.message });
    }

    if (kelasResults.length === 0) {
      return res.status(404).json({ message: 'Kelas tidak ditemukan.' });
    }

    const kelasToDelete = kelasResults[0];
    const deleteSql = 'DELETE FROM Kelas WHERE id = ?';
    db.query(deleteSql, [id], (err, deleteResults) => {
      if (err) {
        console.error('Error deleting kelas:', err);
        return res.status(500).json({ message: 'Gagal menghapus kelas.', error: err.message });
      }

      res.json({ message: 'Kelas berhasil dihapus.', kelas: kelasToDelete });
    });
  });
});

module.exports = router;
