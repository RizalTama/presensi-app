const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');

/**
 * @swagger
 * tags:
 *   name: Guru
 *   description: API untuk manajemen data guru
 * components:
 *   schemas:
 *     Guru:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nama_lengkap:
 *           type: string
 *         nip:
 *           type: string
 *         email:
 *           type: string
 *         mata_kuliah_id:
 *           type: integer
 *         nomor_handphone:
 *           type: string
 *         password:
 *           type: string
 *     NewGuru:
 *       type: object
 *       required:
 *         - nama_lengkap
 *         - nip
 *         - email
 *         - mata_kuliah_id
 *         - password
 *       properties:
 *         nama_lengkap:
 *           type: string
 *         nip:
 *           type: string
 *         email:
 *           type: string
 *         mata_kuliah_id:
 *           type: integer
 *         nomor_handphone:
 *           type: string
 *         password:
 *           type: string
 */

// GET semua guru
/**
 * @swagger
 * /api/guru:
 *   get:
 *     summary: Mengambil semua data guru
 *     tags: [Guru]
 *     responses:
 *       200:
 *         description: Daftar semua guru.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Guru'
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/', (req, res) => {
  const sql = 'SELECT g.id, g.nama_lengkap, g.nip, g.email, g.nomor_handphone, g.password, mk.nama_matkul FROM Guru g JOIN Mata_Kuliah mk ON g.mata_kuliah_id = mk.id';
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    res.json(results);
  });
});

// GET guru berdasarkan ID
/**
 * @swagger
 * /api/guru/{id}:
 *   get:
 *     summary: Mengambil data guru berdasarkan ID
 *     tags: [Guru]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Guru
 *     responses:
 *       200:
 *         description: Data guru.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Guru'
 *       404:
 *         description: Guru tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT g.id, g.nama_lengkap, g.nip, g.email, g.nomor_handphone, g.password, mk.nama_matkul FROM Guru g JOIN Mata_Kuliah mk ON g.mata_kuliah_id = mk.id WHERE g.id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Guru not found' });
    }
    
    res.json(results[0]);
  });
});

/**
 * @swagger
 * /api/guru:
 *   post:
 *     summary: Menambahkan guru baru
 *     tags: [Guru]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewGuru'
 *     responses:
 *       201:
 *         description: Guru berhasil ditambahkan.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Guru'
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/', (req, res) => {
  const { nama_lengkap, nip, email, mata_kuliah_id, nomor_handphone, password } = req.body;

  const sql = 'INSERT INTO Guru (nama_lengkap, nip, email, mata_kuliah_id, nomor_handphone, password) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(sql, [nama_lengkap, nip, email, mata_kuliah_id, nomor_handphone, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error adding guru' });
    }

    // Mendapatkan data guru yang baru ditambahkan
    const newGuruSQL = 'SELECT g.id, g.nama_lengkap, g.nip, g.email, g.nomor_handphone, g.password, mk.nama_matkul FROM Guru g JOIN Mata_Kuliah mk ON g.mata_kuliah_id = mk.id WHERE g.id = ?';
    db.query(newGuruSQL, [results.insertId], (err, newResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error retrieving the added guru' });
      }

      res.status(201).json({
        message: 'Guru added successfully',
        guru: newResults[0],  // Mengembalikan data guru yang baru ditambahkan
      });
    });
  });
});

/**
 * @swagger
 * /api/guru/{id}:
 *   put:
 *     summary: Memperbarui data guru
 *     tags: [Guru]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Guru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewGuru'
 *     responses:
 *       200:
 *         description: Guru berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Guru'
 *       404:
 *         description: Guru tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nama_lengkap, nip, email, mata_kuliah_id, nomor_handphone, password } = req.body;

  const sql = `
    UPDATE Guru 
    SET nama_lengkap = ?, nip = ?, email = ?, mata_kuliah_id = ?, nomor_handphone = ?, password = ? 
    WHERE id = ?
  `;

  db.query(sql, [nama_lengkap, nip, email, mata_kuliah_id, nomor_handphone, password, id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating guru' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Guru not found' });
    }

    // Mendapatkan data guru yang sudah diperbarui
    const updatedGuruSQL = 'SELECT g.id, g.nama_lengkap, g.nip, g.email, g.nomor_handphone, g.password, mk.nama_matkul FROM Guru g JOIN Mata_Kuliah mk ON g.mata_kuliah_id = mk.id WHERE g.id = ?';
    db.query(updatedGuruSQL, [id], (err, updatedResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error retrieving updated guru' });
      }

      res.json({
        message: 'Guru updated successfully',
        guru: updatedResults[0],  // Mengembalikan data guru yang sudah diperbarui
      });
    });
  });
});




/**
 * @swagger
 * /api/guru/{id}:
 *   delete:
 *     summary: Menghapus data guru
 *     tags: [Guru]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Guru
 *     responses:
 *       200:
 *         description: Guru berhasil dihapus.
 *       404:
 *         description: Guru tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Pertama, dapatkan data guru sebelum dihapus
  const getGuruSql = 'SELECT g.id, g.nama_lengkap, g.nip, g.email, g.nomor_handphone, g.password, mk.nama_matkul FROM Guru g JOIN Mata_Kuliah mk ON g.mata_kuliah_id = mk.id WHERE g.id = ?';
  db.query(getGuruSql, [id], (err, guruResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error retrieving guru data' });
    }

    const guruToDelete = guruResults[0];

    // Kemudian hapus guru
    const sql = 'DELETE FROM Guru WHERE id = ?';

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error deleting guru' });
    }
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Guru not found' });
    }

    res.json({ 
      message: 'Guru deleted successfully',
      guru: guruToDelete // Mengembalikan data guru yang dihapus
    });
  });
});
});


module.exports = router;
