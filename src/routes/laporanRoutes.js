const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Laporan
 *   description: API untuk melihat laporan kehadiran
 * components:
 *   schemas:
 *     LaporanKehadiran:
 *       type: object
 *       properties:
 *         laporan_id:
 *           type: integer
 *         nama_siswa:
 *           type: string
 *         nis:
 *           type: string
 *         nama_kelas:
 *           type: string
 *         mata_kuliah:
 *           type: string
 *         guru_pengajar:
 *           type: string
 *         jumlah_kehadiran:
 *           type: integer
 *         total_pertemuan:
 *           type: integer
 *     RekapLaporan:
 *       allOf:
 *         - $ref: '#/components/schemas/LaporanKehadiran'
 *         - type: object
 *           properties:
 *             persentase_kehadiran:
 *               type: number
 *               format: float
 *               description: Persentase kehadiran siswa.
 */

// Endpoint untuk menampilkan laporan semua siswa
/**
 * @swagger
 * /api/laporan:
 *   get:
 *     summary: Menampilkan laporan kehadiran semua siswa
 *     tags: [Laporan]
 *     responses:
 *       200:
 *         description: Daftar laporan kehadiran semua siswa.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LaporanKehadiran'
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/', (req, res) => {
  const sql = `
    SELECT laporan_kehadiran.id AS laporan_id,
            siswa.nama_lengkap AS nama_siswa, siswa.nis,
            kelas.nama_kelas,
            mata_kuliah.nama_matkul AS mata_kuliah,
            guru.nama_lengkap AS guru_pengajar,
           laporan_kehadiran.jumlah_kehadiran, laporan_kehadiran.total_pertemuan
    FROM Laporan_Kehadiran laporan_kehadiran
    JOIN Siswa siswa ON siswa.id = laporan_kehadiran.siswa_id
    JOIN Kelas kelas ON kelas.id = laporan_kehadiran.kelas_id
    JOIN Guru guru ON guru.id = kelas.guru_id
    JOIN Mata_Kuliah mata_kuliah ON mata_kuliah.id = guru.mata_kuliah_id`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    res.json(results);
  });
});

// Endpoint untuk menampilkan laporan berdasarkan ID siswa
/**
 * @swagger
 * /api/laporan/{id}:
 *   get:
 *     summary: Menampilkan laporan kehadiran berdasarkan ID siswa
 *     tags: [Laporan]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Siswa
 *     responses:
 *       200:
 *         description: Laporan kehadiran siswa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LaporanKehadiran'
 *       404:
 *         description: Laporan tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT laporan_kehadiran.id AS laporan_id,
            siswa.nama_lengkap AS nama_siswa, siswa.nis,
            kelas.nama_kelas,
            mata_kuliah.nama_matkul AS mata_kuliah,
            guru.nama_lengkap AS guru_pengajar,
           laporan_kehadiran.jumlah_kehadiran, laporan_kehadiran.total_pertemuan
    FROM Laporan_Kehadiran laporan_kehadiran
    JOIN Siswa siswa ON siswa.id = laporan_kehadiran.siswa_id
    JOIN Kelas kelas ON kelas.id = laporan_kehadiran.kelas_id
    JOIN Guru guru ON guru.id = kelas.guru_id
    JOIN Mata_Kuliah mata_kuliah ON mata_kuliah.id = guru.mata_kuliah_id
    WHERE siswa.id = ?`;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Laporan Kehadiran not found' });
    }
    
    res.json(results[0]);
  });
});

// Endpoint untuk menampilkan semua rekap laporan kehadiran berdasarkan ID siswa
/**
 * @swagger
 * /api/laporan/siswa/{id}/rekap:
 *   get:
 *     summary: Menampilkan rekapitulasi laporan kehadiran untuk seorang siswa
 *     tags: [Laporan]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Siswa
 *     responses:
 *       200:
 *         description: Rekap laporan kehadiran siswa.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RekapLaporan'
 *       404:
 *         description: Rekap laporan tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/siswa/:id/rekap', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT laporan_kehadiran.id AS laporan_id,
            siswa.nama_lengkap AS nama_siswa, siswa.nis,
            kelas.nama_kelas,
            mata_kuliah.nama_matkul AS mata_kuliah,
            guru.nama_lengkap AS guru_pengajar,
           laporan_kehadiran.jumlah_kehadiran, laporan_kehadiran.total_pertemuan,
           ROUND((laporan_kehadiran.jumlah_kehadiran / laporan_kehadiran.total_pertemuan) * 100, 2) AS persentase_kehadiran
    FROM Laporan_Kehadiran laporan_kehadiran
    JOIN Siswa siswa ON siswa.id = laporan_kehadiran.siswa_id
    JOIN Kelas kelas ON kelas.id = laporan_kehadiran.kelas_id
    JOIN Guru guru ON guru.id = kelas.guru_id
    JOIN Mata_Kuliah mata_kuliah ON mata_kuliah.id = guru.mata_kuliah_id
    WHERE siswa.id = ?
    ORDER BY mata_kuliah.nama_matkul ASC`;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error querying the database' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Rekap laporan kehadiran siswa tidak ditemukan' });
    }
    
    res.json(results);
  });
});

module.exports = router;