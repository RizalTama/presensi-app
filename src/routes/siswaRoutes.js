const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Siswa
 *   description: API untuk manajemen data siswa
 * components:
 *   schemas:
 *     Siswa:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unik siswa.
 *         nis:
 *           type: string
 *           description: Nomor Induk Siswa.
 *         nama_lengkap:
 *           type: string
 *           description: Nama lengkap siswa.
 *         email:
 *           type: string
 *           description: Alamat email siswa.
 *         nomor_handphone:
 *           type: string
 *           description: Nomor handphone siswa.
 *         kelas_id:
 *           type: integer
 *           description: ID kelas tempat siswa terdaftar.
 *         password:
 *           type: string
 *           description: Password siswa.
 *     NewSiswa:
 *       type: object
 *       required:
 *         - nis
 *         - nama_lengkap
 *         - email
 *         - kelas_id
 *         - password
 *       properties:
 *         nis:
 *           type: string
 *         nama_lengkap:
 *           type: string
 *         email:
 *           type: string
 *         nomor_handphone:
 *           type: string
 *         kelas_id:
 *           type: integer
 *         password:
 *           type: string
 */

// GET semua siswa
/**
 * @swagger
 * /api/siswa:
 *   get:
 *     summary: Mengambil semua data siswa
 *     tags: [Siswa]
 *     responses:
 *       200:
 *         description: Daftar semua siswa berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Siswa'
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      s.*, 
      k.nama_kelas 
    FROM Siswa s 
    LEFT JOIN Kelas k ON s.kelas_id = k.id`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    res.json(results);
  });
});

// GET siswa berdasarkan ID
/**
 * @swagger
 * /api/siswa/{id}:
 *   get:
 *     summary: Mengambil data siswa berdasarkan ID
 *     tags: [Siswa]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Siswa
 *     responses:
 *       200:
 *         description: Data siswa berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Siswa'
 *       404:
 *         description: Siswa tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      s.*, 
      k.nama_kelas 
    FROM Siswa s 
    LEFT JOIN Kelas k ON s.kelas_id = k.id WHERE s.id = ?`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Siswa not found' });
    }

    res.json(results[0]);
  });
});

// POST (Tambah Siswa)
/**
 * @swagger
 * /api/siswa:
 *   post:
 *     summary: Menambahkan siswa baru
 *     tags: [Siswa]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewSiswa'
 *     responses:
 *       201:
 *         description: Siswa berhasil ditambahkan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/', (req, res) => {
  const { nis, nama_lengkap, email, nomor_handphone, kelas_id, password } = req.body;

  const sql = 'INSERT INTO Siswa (nis, nama_lengkap, email, nomor_handphone, kelas_id, password) VALUES (?, ?, ?, ?, ?, ?)';

  db.query(sql, [nis, nama_lengkap, email, nomor_handphone, kelas_id, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error adding siswa' });
    }

    const newSiswaId = results.insertId;
    const getNewSiswaSql = `
      SELECT 
        s.*, 
        k.nama_kelas 
      FROM Siswa s 
      LEFT JOIN Kelas k ON s.kelas_id = k.id 
      WHERE s.id = ?`;

    db.query(getNewSiswaSql, [newSiswaId], (err, newSiswaResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error retrieving new siswa data' });
        }
        if (newSiswaResult.length === 0) {
            return res.status(404).json({ message: 'Failed to retrieve new siswa' });
        }

      res.status(201).json({
        message: 'Siswa added successfully',
        siswa: newSiswaResult[0],
      });
    });
  });
});

// DELETE (Hapus Siswa)
/**
 * @swagger
 * /api/siswa/{id}:
 *   delete:
 *     summary: Menghapus data siswa
 *     tags: [Siswa]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Siswa
 *     responses:
 *       200:
 *         description: Siswa berhasil dihapus.
 *       404:
 *         description: Siswa tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const getSiswaSql = `
      SELECT 
        s.*, 
        k.nama_kelas 
      FROM Siswa s 
      LEFT JOIN Kelas k ON s.kelas_id = k.id 
      WHERE s.id = ?`;
    db.query(getSiswaSql, [id], (err, siswaResults) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error retrieving siswa data' });
        }

        if (siswaResults.length === 0) {
            return res.status(404).json({ message: 'Siswa not found' });
        }

        const siswaToDelete = siswaResults[0];

        // 2. Hapus data terkait di laporan_kehadiran
        const deleteLaporanSql = 'DELETE FROM Laporan_Kehadiran WHERE siswa_id = ?';
        db.query(deleteLaporanSql, [id], (err, deleteLaporanResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error deleting related reports' });
            }

            // 3. Hapus siswa setelah laporan dihapus
            const deleteSiswaSql = 'DELETE FROM Siswa WHERE id = ?';
            db.query(deleteSiswaSql, [id], (err, deleteSiswaResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Error deleting siswa' });
                }

                if (deleteSiswaResults.affectedRows === 0) {
                    // Ini seharusnya tidak terjadi jika langkah sebelumnya berhasil, tetapi kita tetap periksa
                    return res.status(404).json({ message: 'Siswa not found' });
                }

                res.json({
                    message: 'Siswa deleted successfully',
                    siswa: siswaToDelete, // Mengembalikan data siswa yang dihapus
                });
            });
        });
    });
});

// PUT (Update Siswa)
/**
 * @swagger
 * /api/siswa/{id}:
 *   put:
 *     summary: Memperbarui data siswa
 *     tags: [Siswa]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Siswa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nis:
 *                 type: string
 *               nama_lengkap:
 *                 type: string
 *               email:
 *                 type: string
 *               nomor_handphone:
 *                 type: string
 *               kelas_id:
 *                 type: integer
 *               password:
 *                 type: string
 *                 description: Password baru (opsional).
 *     responses:
 *       200:
 *         description: Siswa berhasil diperbarui.
 *       404:
 *         description: Siswa tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nis, nama_lengkap, email, nomor_handphone, kelas_id, password } = req.body;

  // Jika password tidak diubah, cukup update data selain password
  let sql = 'UPDATE Siswa SET nis = ?, nama_lengkap = ?, email = ?, nomor_handphone = ?, kelas_id = ? WHERE id = ?';
  let params = [nis, nama_lengkap, email, nomor_handphone, kelas_id, id];

  if (password) {
    // Jika password diubah, masukkan password baru
    sql = 'UPDATE Siswa SET nis = ?, nama_lengkap = ?, email = ?, nomor_handphone = ?, kelas_id = ?, password = ? WHERE id = ?';
    params = [nis, nama_lengkap, email, nomor_handphone, kelas_id, password, id];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error updating siswa' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Siswa not found' });
    }

    const getUpdatedSiswaSql = `
      SELECT 
        s.*, 
        k.nama_kelas 
      FROM Siswa s 
      LEFT JOIN Kelas k ON s.kelas_id = k.id 
      WHERE s.id = ?`;

    db.query(getUpdatedSiswaSql, [id], (err, updatedSiswaResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error retrieving updated siswa data' });
        }
        if (updatedSiswaResult.length === 0) {
            return res.status(404).json({ message: 'Failed to retrieve updated siswa' });
        }

      res.json({
        message: 'Siswa updated successfully',
        siswa: updatedSiswaResult[0],
      });
    });
  });
});

module.exports = router;
