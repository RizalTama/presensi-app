const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Presensi Siswa
 *   description: API untuk siswa melakukan presensi dan melihat rekap
 * components:
 *   schemas:
 *     RekapKehadiranSiswa:
 *       type: object
 *       properties:
 *         kelas_id:
 *           type: integer
 *         nama_kelas:
 *           type: string
 *         nama_matkul:
 *           type: string
 *         kode_matkul:
 *           type: string
 *         nama_guru:
 *           type: string
 *         total_pertemuan:
 *           type: integer
 *         jumlah_kehadiran:
 *           type: integer
 *         total_presensi:
 *           type: integer
 *         persentase_kehadiran:
 *           type: number
 *           format: float
 */

// Endpoint untuk siswa melakukan presensi
/**
 * @swagger
 * /api/presensi-siswa/presensi/{siswa_id}:
 *   post:
 *     summary: Siswa melakukan presensi menggunakan kode
 *     tags: [Presensi Siswa]
 *     parameters:
 *       - in: path
 *         name: siswa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Siswa yang melakukan presensi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kelas_id, kode_presensi]
 *             properties:
 *               kelas_id:
 *                 type: integer
 *               kode_presensi:
 *                 type: string
 *                 description: Kode presensi 6 digit yang diberikan guru.
 *     responses:
 *       200:
 *         description: Presensi berhasil.
 *       400:
 *         description: Input tidak valid, kode salah, atau siswa sudah presensi hari ini.
 *       404:
 *         description: Kelas tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/presensi/:siswa_id', (req, res) => {
  const { siswa_id } = req.params;  // Mengambil siswa_id dari URL parameter
  const { kelas_id, kode_presensi } = req.body;  // Mengambil kelas_id dan kode_presensi dari body request

  console.log('Siswa melakukan presensi:', { siswa_id, kelas_id, kode_presensi });

  // Validasi siswa_id dan kelas_id (integer)
  if (isNaN(siswa_id) || !Number.isInteger(Number(siswa_id))) {
    return res.status(400).json({ message: 'ID siswa harus berupa integer' });
  }

  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  // Validasi kode presensi (pastikan panjangnya 6 karakter)
  if (!kode_presensi || kode_presensi.length !== 6) {
    return res.status(400).json({ message: 'Kode presensi harus terdiri dari 6 karakter' });
  }

  // Cek apakah kelas yang dipilih ada
  const checkKelasSQL = 'SELECT id, nama_kelas FROM Kelas WHERE id = ?';
  db.query(checkKelasSQL, [kelas_id], (err, kelasResults) => {
    if (err) {
      console.error('Error checking kelas:', err);
      return res.status(500).json({ message: 'Error checking kelas', error: err.message });
    }

    if (kelasResults.length === 0) {
      return res.status(404).json({ message: 'Kelas tidak ditemukan' });
    }

    // Cek apakah kode presensi sesuai dengan kelas yang dipilih
    const checkPresensiSQL = 'SELECT kode_presensi FROM Presensi_Kelas WHERE kelas_id = ?';
    db.query(checkPresensiSQL, [kelas_id], (err, presensiResults) => {
      if (err) {
        console.error('Error checking presensi kode:', err);
        return res.status(500).json({ message: 'Error checking presensi kode', error: err.message });
      }

      if (presensiResults.length === 0 || presensiResults[0].kode_presensi !== kode_presensi) {
        return res.status(400).json({ message: 'Kode presensi tidak valid atau tidak sesuai dengan kelas ini' });
      }

      // Cek apakah siswa sudah melakukan presensi pada hari yang sama untuk kelas ini
      const checkExistingPresensiSQL = `
        SELECT id FROM Presensi
        WHERE siswa_id = ? AND kelas_id = ? AND DATE(created_at) = CURDATE()
      `;
      
      db.query(checkExistingPresensiSQL, [siswa_id, kelas_id], (err, existingResults) => {
        if (err) {
          console.error('Error checking existing presensi:', err);
          return res.status(500).json({ message: 'Error checking existing presensi', error: err.message });
        }

        if (existingResults.length > 0) {
          return res.status(400).json({ message: 'Siswa sudah melakukan presensi hari ini' });
        }

        // Jika belum, simpan presensi siswa dengan status 'Hadir'
        const insertPresensiSQL = `
          INSERT INTO Presensi (kelas_id, siswa_id, status, tanggal, created_at)
          VALUES (?, ?, 'Hadir', NOW(), NOW())
        `;
        
        db.query(insertPresensiSQL, [kelas_id, siswa_id], (err, insertResults) => {
          if (err) {
            console.error('Error saving presensi:', err);
            return res.status(500).json({ message: 'Error saving presensi', error: err.message });
          }

          // Update jumlah kehadiran di tabel Laporan_Kehadiran
          const updateLaporanKehadiranSQL = `
            UPDATE Laporan_Kehadiran
            SET jumlah_kehadiran = jumlah_kehadiran + 1
            WHERE siswa_id = ? AND kelas_id = ?
          `;

          db.query(updateLaporanKehadiranSQL, [siswa_id, kelas_id], (err, updateResults) => {
            if (err) {
              console.error('Error updating Laporan Kehadiran:', err);
              return res.status(500).json({ message: 'Error updating Laporan Kehadiran', error: err.message });
            }

            console.log('Presensi siswa berhasil disimpan dan jumlah kehadiran diperbarui!');
            res.status(200).json({
              message: 'Presensi siswa berhasil!',
              siswa_id: siswa_id,
              kelas_id: kelas_id,
              status: 'hadir',
              timestamp: new Date().toISOString(),
            });
          });
        });
      });
    });
  });
});



// GET: Rekap kehadiran siswa
/**
 * @swagger
 * /api/presensi-siswa/rekap/{siswaId}:
 *   get:
 *     summary: Mendapatkan rekapitulasi kehadiran untuk seorang siswa
 *     tags: [Presensi Siswa]
 *     parameters:
 *       - in: path
 *         name: siswaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Siswa
 *     responses:
 *       200:
 *         description: Rekap kehadiran berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RekapKehadiranSiswa'
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/rekap/:siswaId', async (req, res) => {
  try {
    const { siswaId } = req.params;
    
    const query = `
      SELECT 
        k.id as kelas_id,
        k.nama_kelas,
        mk.nama_matkul,
        mk.kode_matkul,
        g.nama_lengkap as nama_guru,
        mk.pertemuan as total_pertemuan,
        COUNT(CASE WHEN p.status = 'hadir' THEN 1 END) as jumlah_kehadiran,
        COUNT(p.id) as total_presensi,
        ROUND(
          (COUNT(CASE WHEN p.status = 'hadir' THEN 1 END) * 100.0 / mk.pertemuan), 2
        ) as persentase_kehadiran
      FROM Kelas k
      JOIN Guru g ON k.guru_id = g.id
      JOIN Mata_Kuliah mk ON g.mata_kuliah_id = mk.id
      JOIN Siswa s ON s.kelas_id = k.id
      LEFT JOIN Presensi p ON p.kelas_id = k.id AND p.siswa_id = s.id
      WHERE s.id = ?
      GROUP BY k.id, k.nama_kelas, mk.nama_matkul, mk.kode_matkul, g.nama_lengkap, mk.pertemuan
      ORDER BY k.nama_kelas
    `;
    
    const result = await db.execute(query, [siswaId]);
    const rows = Array.isArray(result) ? result : result.rows || result;
    
    res.json({
      success: true,
      message: 'Data rekap kehadiran berhasil diambil',
      data: rows
    });
    
  } catch (error) {
    console.error('Error fetching rekap kehadiran:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data rekap kehadiran',
      error: error.message
    });
  }
});

module.exports = router;