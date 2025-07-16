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
  const sql = 'SELECT * FROM Kelas';
  
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

  const sql = 'SELECT * FROM Kelas WHERE id = ?';
  
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

      res.status(201).json({
        message: 'Kelas added successfully',
        kelasId: id,  // Mengembalikan ID yang telah dimasukkan
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

      res.json({ message: 'Kelas updated successfully' });
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

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'ID harus bertipe integer' });
  }

  const sql = 'DELETE FROM Kelas WHERE id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error deleting kelas' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Kelas not found' });
    }

    res.json({ message: 'Kelas deleted successfully' });
  });
});

module.exports = router;
