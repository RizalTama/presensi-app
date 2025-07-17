const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');

// Fungsi untuk generate kode presensi acak (6 karakter)
function generatePresensiCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 karakter
}

// Object untuk menyimpan timer refresh kode presensi
const refreshTimers = new Map();

// Fungsi untuk auto-refresh kode presensi setiap 10 detik
function startAutoRefresh(kelas_id) {
  // Hentikan timer yang sudah ada jika ada
  if (refreshTimers.has(kelas_id)) {
    clearInterval(refreshTimers.get(kelas_id));
  }

  // Buat timer baru
  const timer = setInterval(() => {
    console.log(`Auto-refreshing kode presensi untuk kelas ${kelas_id}`);
    
    // Generate kode baru
    const newKode = generatePresensiCode();
    
    // Update kode di database
    const updateSQL = 'UPDATE Presensi_Kelas SET kode_presensi = ?, updated_at = NOW() WHERE kelas_id = ?';
    db.query(updateSQL, [newKode, kelas_id], (err, results) => {
      if (err) {
        console.error('Error updating kode presensi:', err);
        return;
      }
      
      if (results.affectedRows === 0) {
        // Jika tidak ada data yang diupdate, berarti sesi sudah berakhir
        console.log(`Sesi presensi untuk kelas ${kelas_id} sudah berakhir, stopping auto-refresh`);
        stopAutoRefresh(kelas_id);
      } else {
        console.log(`Kode presensi untuk kelas ${kelas_id} berhasil diupdate menjadi: ${newKode}`);
      }
    });
  }, 180000); // 3 menit = 180000 ms

  // Simpan timer
  refreshTimers.set(kelas_id, timer);
}

// Fungsi untuk menghentikan auto-refresh
function stopAutoRefresh(kelas_id) {
  if (refreshTimers.has(kelas_id)) {
    clearInterval(refreshTimers.get(kelas_id));
    refreshTimers.delete(kelas_id);
    console.log(`Auto-refresh untuk kelas ${kelas_id} dihentikan`);
  }
}

/**
 * @swagger
 * tags:
 *   name: Presensi Guru
 *   description: API untuk guru mengelola sesi presensi
 */




// 2. POST untuk membuka sesi presensi (membuat kode presensi dengan auto-refresh)
/**
 * @swagger
 * /api/presensi-guru/presensi/{kelas_id}:
 *   post:
 *     summary: Membuka sesi presensi untuk sebuah kelas
 *     description: Endpoint ini akan membuat kode presensi 6 digit yang akan diperbarui secara otomatis setiap 10 detik. Jika sesi sudah ada, akan mengembalikan kode yang sedang aktif.
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     responses:
 *       201:
 *         description: Sesi presensi berhasil dibuka.
 *       200:
 *         description: Sesi presensi sudah aktif untuk kelas ini.
 *       400:
 *         description: ID kelas tidak valid.
 *       404:
 *         description: Kelas tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/presensi/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;
  
  console.log('Attempting to create presensi for kelas_id:', kelas_id);
  
  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  // Cek apakah kelas ada dan milik guru yang sedang login
  const checkKelasSQL = 'SELECT id, nama_kelas FROM Kelas WHERE id = ?';
  db.query(checkKelasSQL, [kelas_id], (err, kelasResults) => {
    if (err) {
      console.error('Error checking kelas:', err);
      return res.status(500).json({ 
        message: 'Error checking kelas',
        error: err.message 
      });
    }

    if (kelasResults.length === 0) {
      return res.status(404).json({ message: 'Kelas tidak ditemukan' });
    }

    console.log('Kelas found:', kelasResults[0]);

    // Cek apakah sudah ada sesi presensi aktif untuk kelas ini
    const checkActiveSQL = 'SELECT id, kode_presensi FROM Presensi_Kelas WHERE kelas_id = ?';
    db.query(checkActiveSQL, [kelas_id], (err, activeResults) => {
      if (err) {
        console.error('Error checking active session:', err);
        return res.status(500).json({ 
          message: 'Error checking active session',
          error: err.message 
        });
      }

      if (activeResults.length > 0) {
        console.log('Active session found:', activeResults[0]);
        
        // Jika sudah ada sesi aktif, pastikan auto-refresh berjalan
        startAutoRefresh(kelas_id);
        
        return res.status(200).json({ 
          message: 'Sesi presensi sudah aktif untuk kelas ini',
          kode_presensi: activeResults[0].kode_presensi,
          auto_refresh: true,
          refresh_interval: 10, // dalam detik
          session_status: 'already_active'
        });
      }

      // Generate kode presensi acak
      const kode_presensi = generatePresensiCode();
      console.log('Generated kode_presensi:', kode_presensi);
      
      // Simpan kode presensi untuk kelas tertentu dengan tanggal sekarang
      const sql = 'INSERT INTO Presensi_Kelas (kelas_id, kode_presensi, tanggal, created_at, updated_at) VALUES (?, ?, NOW(), NOW(), NOW())';
      
      db.query(sql, [kelas_id, kode_presensi], (err, results) => {
        if (err) {
          console.error('Database error details:', err);
          return res.status(500).json({ 
            message: 'Error opening presensi session',
            error: err.message,
            code: err.code,
            errno: err.errno
          });
        }

        console.log('Presensi session created successfully:', results);
        
        // Mulai auto-refresh kode presensi
        startAutoRefresh(kelas_id);
        
        res.status(201).json({
          message: 'Sesi presensi dibuka!',
          kode_presensi: kode_presensi,
          kelas_id: kelas_id,
          session_id: results.insertId,
          auto_refresh: true,
          refresh_interval: 10 // dalam detik
        });
      });
    });
  });
});

// 2b. POST untuk restart sesi presensi yang sudah aktif
/**
 * @swagger
 * /api/presensi-guru/presensi/restart/{kelas_id}:
 *   post:
 *     summary: Me-restart sesi presensi yang sudah aktif (membuat kode baru)
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Kode presensi berhasil di-restart.
 *       404:
 *         description: Tidak ada sesi presensi aktif untuk kelas ini.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/presensi/restart/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;
  
  console.log('Attempting to restart presensi for kelas_id:', kelas_id);
  
  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  // Cek apakah ada sesi presensi aktif
  const checkActiveSQL = 'SELECT id, kode_presensi FROM Presensi_Kelas WHERE kelas_id = ?';
  db.query(checkActiveSQL, [kelas_id], (err, activeResults) => {
    if (err) {
      console.error('Error checking active session:', err);
      return res.status(500).json({ 
        message: 'Error checking active session',
        error: err.message 
      });
    }

    if (activeResults.length === 0) {
      return res.status(404).json({ message: 'Tidak ada sesi presensi aktif untuk kelas ini' });
    }

    // Generate kode presensi baru
    const new_kode_presensi = generatePresensiCode();
    console.log('Generated new kode_presensi:', new_kode_presensi);

    // Update kode presensi yang sudah ada
    const updateSQL = 'UPDATE Presensi_Kelas SET kode_presensi = ?, updated_at = NOW() WHERE kelas_id = ?';
    
    db.query(updateSQL, [new_kode_presensi, kelas_id], (err, updateResults) => {
      if (err) {
        console.error('Error updating kode presensi:', err);
        return res.status(500).json({ 
          message: 'Error updating kode presensi',
          error: err.message 
        });
      }

      console.log('Presensi kode updated successfully:', updateResults);
      
      // Restart auto-refresh
      startAutoRefresh(kelas_id);
      
      res.json({
        message: 'Kode presensi berhasil di-restart!',
        old_kode: activeResults[0].kode_presensi,
        new_kode: new_kode_presensi,
        kelas_id: kelas_id,
        auto_refresh: true,
        refresh_interval: 10
      });
    });
  });
});

/**
 * @swagger
 * /api/presensi-guru/presensi/current/{kelas_id}:
 *   get:
 *     summary: Mendapatkan kode presensi yang sedang aktif untuk sebuah kelas
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Informasi sesi presensi yang aktif.
 *       404:
 *         description: Tidak ada sesi presensi aktif untuk kelas ini.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/presensi/current/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;
  
  console.log('Getting current presensi kode for kelas_id:', kelas_id);
  
  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  const sql = `
    SELECT 
      pk.kode_presensi,
      pk.tanggal,
      pk.created_at,
      pk.updated_at,
      k.nama_kelas
    FROM Presensi_Kelas pk
    JOIN Kelas k ON pk.kelas_id = k.id
    WHERE pk.kelas_id = ?
  `;

  db.query(sql, [kelas_id], (err, results) => {
    if (err) {
      console.error('Error getting current kode presensi:', err);
      return res.status(500).json({ 
        message: 'Error getting current kode presensi',
        error: err.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        message: 'Tidak ada sesi presensi aktif untuk kelas ini' 
      });
    }

    const session = results[0];
    res.json({
      kode_presensi: session.kode_presensi,
      nama_kelas: session.nama_kelas,
      tanggal: session.tanggal,
      created_at: session.created_at,
      updated_at: session.updated_at,
      auto_refresh: true,
      refresh_interval: 10 // dalam detik
    });
  });
});
// 3. POST untuk input manual presensi (nis, status)
/**
 * @swagger
 * /api/presensi-guru/presensi/input-manual/{kelas_id}:
 *   post:
 *     summary: Input presensi siswa secara manual oleh guru
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nis, status]
 *             properties:
 *               nis:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [hadir, dibatalkan]
 *     responses:
 *       200:
 *         description: Presensi siswa berhasil diinput secara manual.
 *       400:
 *         description: Input tidak valid atau siswa sudah melakukan presensi.
 *       404:
 *         description: Siswa tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/presensi/input-manual/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;
  const { nis, status } = req.body; // nis = NIS siswa, status = Hadir atau Tidak Hadir

  console.log('Manual presensi input:', { kelas_id, nis, status });

  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  // Validasi NIS (integer)
  if (isNaN(nis) || !Number.isInteger(Number(nis))) {
    return res.status(400).json({ message: 'NIS siswa harus berupa integer' });
  }

  // Validasi status presensi
  if (!status || !['hadir', 'dibatalkan'].includes(status)) {
    return res.status(400).json({ message: 'Status presensi harus salah satu dari: Hadir, Tidak Hadir, Izin, Sakit' });
  }

  // Cek apakah siswa ada
  const checkSiswaSQL = 'SELECT id, nama_lengkap FROM Siswa WHERE nis = ?';
  db.query(checkSiswaSQL, [nis], (err, siswaResults) => {
    if (err) {
      console.error('Error checking siswa:', err);
      return res.status(500).json({ 
        message: 'Error checking siswa',
        error: err.message 
      });
    }

    if (siswaResults.length === 0) {
      return res.status(404).json({ message: 'Siswa dengan NIS tersebut tidak ditemukan' });
    }

    const siswa = siswaResults[0];
    console.log('Siswa found:', siswa);

    // Cek apakah sudah ada presensi untuk siswa ini di kelas ini hari ini
    const checkExistingSQL = `
      SELECT id FROM Presensi 
      WHERE siswa_id = ? AND kelas_id = ? AND DATE(created_at) = CURDATE()
    `;
    
    db.query(checkExistingSQL, [siswa.id, kelas_id], (err, existingResults) => {
      if (err) {
        console.error('Error checking existing presensi:', err);
        return res.status(500).json({ 
          message: 'Error checking existing presensi',
          error: err.message 
        });
      }

      if (existingResults.length > 0) {
        return res.status(400).json({ message: 'Siswa sudah melakukan presensi hari ini' });
      }

      // Jika belum, simpan presensi siswa dengan status 'Hadir'
      const insertPresensiSQL = `
        INSERT INTO Presensi (kelas_id, siswa_id, status, tanggal, created_at)
        VALUES (?, ?, 'Hadir', NOW(), NOW())
      `;
      
      db.query(insertPresensiSQL, [kelas_id, siswa.id], (err, insertResults) => {
        if (err) {
          console.error('Error saving presensi:', err);
          return res.status(500).json({ message: 'Error saving presensi', error: err.message });
        }

        // Update jumlah kehadiran di tabel Laporan_Kehadiran jika status presensi 'Hadir'
        if (status === 'hadir') {
          const updateLaporanKehadiranSQL = `
            UPDATE Laporan_Kehadiran
            SET jumlah_kehadiran = jumlah_kehadiran + 1
            WHERE siswa_id = ? AND kelas_id = ?
          `;
          
          db.query(updateLaporanKehadiranSQL, [siswa.id, kelas_id], (err, updateResults) => {
            if (err) {
              console.error('Error updating Laporan Kehadiran:', err);
              return res.status(500).json({ message: 'Error updating Laporan Kehadiran', error: err.message });
            }

            console.log('Presensi siswa berhasil disimpan dan jumlah kehadiran diperbarui!');
            res.status(200).json({
              message: 'Presensi siswa berhasil!',
              siswa_id: siswa.id,
              kelas_id: kelas_id,
              status: 'hadir',
              timestamp: new Date().toISOString(),
            });
          });
        } else {
          res.status(200).json({
            message: 'Presensi siswa berhasil!',
            siswa_id: siswa.id,
            kelas_id: kelas_id,
            status: status,
            timestamp: new Date().toISOString(),
          });
        }
      });
    });
  });
});




// 4. GET untuk mengambil data presensi berdasarkan kode presensi
// router.get('/presensi/:kode', (req, res) => {
//   const { kode } = req.params;
  
//   console.log('Getting presensi data for kode:', kode);
  
//   // Validasi kode presensi
//   if (kode.length !== 6) {
//     return res.status(400).json({ message: 'Kode presensi tidak valid' });
//   }

//   const sql = `
//     SELECT 
//       siswa.nama_lengkap, 
//       siswa.nis, 
//       presensi.status_presensi,
//       presensi.created_at,
//       kelas.nama_kelas
//     FROM Presensi presensi
//     JOIN Siswa siswa ON presensi.siswa_id = siswa.id
//     JOIN Kelas kelas ON presensi.kelas_id = kelas.id
//     JOIN Presensi_Kelas pk ON pk.kelas_id = presensi.kelas_id
//     WHERE pk.kode_presensi = ? AND DATE(presensi.created_at) = DATE(pk.tanggal)
//     ORDER BY presensi.created_at DESC`;

//   db.query(sql, [kode], (err, results) => {
//     if (err) {
//       console.error('Error retrieving presensi data:', err);
//       return res.status(500).json({ 
//         message: 'Error retrieving presensi data',
//         error: err.message 
//       });
//     }
    
//     if (results.length === 0) {
//       return res.status(404).json({ message: 'Presensi tidak ditemukan atau kode tidak valid' });
//     }

//     console.log('Presensi data retrieved:', results.length, 'records');
//     res.json({
//       kode_presensi: kode,
//       nama_kelas: results[0].nama_kelas,
//       total_presensi: results.length,
//       data: results
//     });
//   });
// });

// // 5. DELETE untuk menghapus presensi berdasarkan ID siswa dan kelas
// router.delete('/presensi/:siswa_id/:kelas_id', (req, res) => {
//   const { siswa_id, kelas_id } = req.params;

//   console.log('Deleting presensi for siswa_id:', siswa_id, 'kelas_id:', kelas_id);

//   // Validasi ID siswa dan kelas (integer)
//   if (isNaN(siswa_id) || !Number.isInteger(Number(siswa_id)) || 
//       isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
//     return res.status(400).json({ message: 'ID siswa dan kelas harus berupa integer' });
//   }

//   // Cek apakah presensi ada
//   const checkSQL = 'SELECT id FROM Presensi WHERE siswa_id = ? AND kelas_id = ?';
//   db.query(checkSQL, [siswa_id, kelas_id], (err, checkResults) => {
//     if (err) {
//       console.error('Error checking presensi:', err);
//       return res.status(500).json({ 
//         message: 'Error checking presensi',
//         error: err.message 
//       });
//     }

//     if (checkResults.length === 0) {
//       return res.status(404).json({ message: 'Presensi tidak ditemukan' });
//     }

//     const deleteSQL = 'DELETE FROM Presensi WHERE siswa_id = ? AND kelas_id = ?';
    
//     db.query(deleteSQL, [siswa_id, kelas_id], (err, deleteResults) => {
//       if (err) {
//         console.error('Error deleting presensi:', err);
//         return res.status(500).json({ 
//           message: 'Error deleting presensi',
//           error: err.message 
//         });
//       }

//       console.log('Presensi deleted:', deleteResults);
//       res.json({
//         message: 'Presensi siswa berhasil dihapus!',
//         deleted_rows: deleteResults.affectedRows
//       });
//     });
//   });
// });

// ## --- Endpoint untuk mengambil daftar presensi real-time
/**
 * @swagger
 * /api/presensi-guru/presensi/daftar-siswa/{kelas_id}:
 *   get:
 *     summary: Mengambil daftar siswa yang sudah melakukan presensi (real-time)
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *       - in: query
 *         name: tanggal
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal presensi (YYYY-MM-DD). Default hari ini.
 *     responses:
 *       200:
 *         description: Daftar siswa yang sudah presensi.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/presensi/daftar-siswa/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;
  const { tanggal } = req.query; // Optional: format YYYY-MM-DD

  console.log('Getting daftar siswa presensi for kelas_id:', kelas_id, 'tanggal:', tanggal);

  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  let dateCondition = 'DATE(p.created_at) = CURDATE()';
  let queryParams = [kelas_id];

  if (tanggal) {
    dateCondition = 'DATE(p.created_at) = ?';
    queryParams.push(tanggal);
  }

  // PERBAIKAN: Query yang konsisten dengan nama kolom
  const sql = `
    SELECT 
      s.nis,
      s.nama_lengkap,
      p.status as status_presensi,
      p.created_at,
      k.nama_kelas,
      TIME(p.created_at) as waktu_presensi
    FROM Presensi p
    JOIN Siswa s ON p.siswa_id = s.id
    JOIN Kelas k ON p.kelas_id = k.id
    WHERE p.kelas_id = ? AND ${dateCondition}
    ORDER BY p.created_at DESC, s.nama_lengkap ASC
  `;

  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error('Error getting daftar siswa presensi:', err);
      return res.status(500).json({ 
        message: 'Error getting daftar siswa presensi',
        error: err.message 
      });
    }

    console.log('Daftar siswa presensi retrieved:', results.length, 'records');

    // Summary statistics
    const summary = {
      total: results.length,
      hadir: results.filter(r => r.status_presensi === 'hadir').length,
      dibatalkan: results.filter(r => r.status_presensi === 'dibatalkan').length,
    };

    res.json({
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      nama_kelas: results.length > 0 ? results[0].nama_kelas : null,
      summary: summary,
      data: results.map(row => ({
        nis: row.nis,
        nama_lengkap: row.nama_lengkap,
        status: row.status_presensi,
        waktu_presensi: row.waktu_presensi,
        timestamp: row.created_at
      }))
    });
  });
});


// 6. PUT untuk menyimpan presensi setelah selesai
/**
 * @swagger
 * /api/presensi-guru/presensi/selesai/{kelas_id}:
 *   put:
 *     summary: Menyelesaikan sesi presensi
 *     description: Menghapus kode presensi yang aktif dan menghentikan mekanisme auto-refresh.
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Sesi presensi berhasil diselesaikan.
 *       404:
 *         description: Tidak ada sesi presensi aktif untuk kelas ini.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.put('/presensi/selesai/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;

  console.log('Ending presensi session for kelas_id:', kelas_id);

  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  // Cek apakah ada sesi presensi aktif
  const checkActiveSQL = 'SELECT id, kode_presensi FROM Presensi_Kelas WHERE kelas_id = ?';
  db.query(checkActiveSQL, [kelas_id], (err, activeResults) => {
    if (err) {
      console.error('Error checking active session:', err);
      return res.status(500).json({ 
        message: 'Error checking active session',
        error: err.message 
      });
    }

    if (activeResults.length === 0) {
      return res.status(404).json({ message: 'Tidak ada sesi presensi aktif untuk kelas ini' });
    }

    // Hentikan auto-refresh terlebih dahulu
    stopAutoRefresh(kelas_id);

    // Hapus kode presensi di tabel Presensi_Kelas untuk kelas tersebut
    const deleteSQL = 'DELETE FROM Presensi_Kelas WHERE kelas_id = ?';
    
    db.query(deleteSQL, [kelas_id], (err, deleteResults) => {
      if (err) {
        console.error('Error ending presensi session:', err);
        return res.status(500).json({ 
          message: 'Error ending presensi session',
          error: err.message 
        });
      }

      console.log('Presensi session ended:', deleteResults);
      res.json({ 
        message: 'Presensi sesi telah diselesaikan dan kode presensi dihapus',
        kode_presensi: activeResults[0].kode_presensi,
        deleted_rows: deleteResults.affectedRows,
        auto_refresh_stopped: true
      });
    });
  });
});

// 7. GET untuk mengambil status sesi presensi aktif
/**
 * @swagger
 * /api/presensi-guru/presensi/status/{kelas_id}:
 *   get:
 *     summary: Memeriksa status sesi presensi untuk sebuah kelas
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     responses:
 *       200:
 *         description: Status sesi presensi (aktif atau tidak aktif).
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get('/presensi/status/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;

  console.log('Checking presensi status for kelas_id:', kelas_id);

  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  const sql = `
    SELECT 
      pk.id,
      pk.kode_presensi,
      pk.tanggal,
      pk.created_at,
      pk.updated_at,
      k.nama_kelas,
      COUNT(p.id) as total_presensi
    FROM Presensi_Kelas pk
    JOIN Kelas k ON pk.kelas_id = k.id
    LEFT JOIN Presensi p ON p.kelas_id = pk.kelas_id AND DATE(p.created_at) = DATE(pk.tanggal)
    WHERE pk.kelas_id = ?
    GROUP BY pk.id, pk.kode_presensi, pk.tanggal, pk.created_at, pk.updated_at, k.nama_kelas
  `;

  db.query(sql, [kelas_id], (err, results) => {
    if (err) {
      console.error('Error checking presensi status:', err);
      return res.status(500).json({ 
        message: 'Error checking presensi status',
        error: err.message 
      });
    }

    if (results.length === 0) {
      return res.json({ 
        status: 'inactive',
        message: 'Tidak ada sesi presensi aktif'
      });
    }

    console.log('Active presensi session:', results[0]);
    res.json({
      status: 'active',
      session: results[0],
      auto_refresh: true,
      refresh_interval: 10 // dalam detik
    });
  });
});

// 8. POST untuk membatalkan presensi berdasarkan NIS siswa dan kelas
/**
 * @swagger
 * /api/presensi-guru/presensi/batalkan/{kelas_id}:
 *   post:
 *     summary: Membatalkan presensi seorang siswa
 *     tags: [Presensi Guru]
 *     parameters:
 *       - in: path
 *         name: kelas_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Kelas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nis]
 *             properties:
 *               nis:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Presensi berhasil dibatalkan.
 *       404:
 *         description: Siswa atau data presensi tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post('/presensi/batalkan/:kelas_id', (req, res) => {
  const { kelas_id } = req.params;
  const { nis } = req.body; // nis = NIS siswa

  console.log('Attempting to cancel presensi for siswa with NIS:', nis, 'in kelas_id:', kelas_id);

  // Validasi ID kelas (integer)
  if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
    return res.status(400).json({ message: 'ID kelas harus berupa integer' });
  }

  // Validasi NIS (integer)
  if (isNaN(nis) || !Number.isInteger(Number(nis))) {
    return res.status(400).json({ message: 'NIS siswa harus berupa integer' });
  }

  // Cek apakah siswa ada
  const checkSiswaSQL = 'SELECT id, nama_lengkap FROM Siswa WHERE nis = ?';
  db.query(checkSiswaSQL, [nis], (err, siswaResults) => {
    if (err) {
      console.error('Error checking siswa:', err);
      return res.status(500).json({ 
        message: 'Error checking siswa',
        error: err.message 
      });
    }

    if (siswaResults.length === 0) {
      return res.status(404).json({ message: 'Siswa dengan NIS tersebut tidak ditemukan' });
    }

    const siswa = siswaResults[0];
    console.log('Siswa found:', siswa);

    // Cek apakah presensi untuk siswa ini ada di kelas ini hari ini
    const checkExistingSQL = `
      SELECT id, status FROM Presensi 
      WHERE siswa_id = ? AND kelas_id = ? AND DATE(created_at) = CURDATE()
    `;
    
    db.query(checkExistingSQL, [siswa.id, kelas_id], (err, existingResults) => {
      if (err) {
        console.error('Error checking existing presensi:', err);
        return res.status(500).json({ 
          message: 'Error checking existing presensi',
          error: err.message 
        });
      }

      if (existingResults.length === 0) {
        return res.status(404).json({ message: 'Presensi tidak ditemukan untuk siswa ini di kelas ini' });
      }

      const presensiToUpdate = existingResults[0];

      // Jika presensi sudah dibatalkan, tidak perlu melakukan apa-apa lagi
      if (presensiToUpdate.status === 'dibatalkan') {
        return res.status(200).json({
          message: 'Presensi untuk siswa ini sudah dalam status dibatalkan.',
          siswa: siswa.nama_lengkap,
          status: 'dibatalkan'
        });
      }

      // Update status presensi menjadi 'dibatalkan'
      const updateSQL = 'UPDATE Presensi SET status = "dibatalkan" WHERE id = ?';
      db.query(updateSQL, [presensiToUpdate.id], (err, updateResults) => {
        if (err) {
          console.error('Error updating presensi:', err);
          return res.status(500).json({ 
            message: 'Error updating presensi',
            error: err.message 
          });
        }

        // Hanya kurangi jumlah kehadiran jika status sebelumnya adalah 'hadir'
        if (presensiToUpdate.status === 'hadir') {
          const updateLaporanSQL = `
            UPDATE Laporan_kehadiran
            SET jumlah_kehadiran = GREATEST(0, jumlah_kehadiran - 1)
            WHERE siswa_id = ? AND kelas_id = ?
          `;
          
          db.query(updateLaporanSQL, [siswa.id, kelas_id], (err, laporanResults) => {
            if (err) {
              // Tetap kirim response sukses karena presensi sudah dibatalkan, tapi log error
              console.error('Gagal mengurangi jumlah kehadiran di laporan:', err);
            }
            console.log(`Jumlah kehadiran untuk siswa ${siswa.nama_lengkap} di kelas ${kelas_id} berhasil dikurangi.`);
          });
        }

        res.json({
          message: 'Presensi berhasil dibatalkan dan laporan kehadiran telah diperbarui!',
          siswa: siswa.nama_lengkap,
          status: 'dibatalkan'
        });
      });
    });
  });
});


// 9. GET untuk mengambil laporan presensi harian
// router.get('/presensi/laporan/:kelas_id', (req, res) => {
//   const { kelas_id } = req.params;
//   const { tanggal } = req.query; // Optional: format YYYY-MM-DD

//   console.log('Getting presensi report for kelas_id:', kelas_id, 'tanggal:', tanggal);

//   // Validasi ID kelas (integer)
//   if (isNaN(kelas_id) || !Number.isInteger(Number(kelas_id))) {
//     return res.status(400).json({ message: 'ID kelas harus berupa integer' });
//   }

//   let dateCondition = 'DATE(p.created_at) = CURDATE()';
//   let queryParams = [kelas_id];

//   if (tanggal) {
//     dateCondition = 'DATE(p.created_at) = ?';
//     queryParams.push(tanggal);
//   }

//   const sql = `
//     SELECT 
//       s.nis,
//       s.nama_lengkap,
//       p.status_presensi,
//       p.created_at,
//       k.nama_kelas
//     FROM Presensi p
//     JOIN Siswa s ON p.siswa_id = s.id
//     JOIN Kelas k ON p.kelas_id = k.id
//     WHERE p.kelas_id = ? AND ${dateCondition}
//     ORDER BY s.nama_lengkap ASC
//   `;

//   db.query(sql, queryParams, (err, results) => {
//     if (err) {
//       console.error('Error getting presensi report:', err);
//       return res.status(500).json({ 
//         message: 'Error getting presensi report',
//         error: err.message 
//       });
//     }

//     console.log('Presensi report retrieved:', results.length, 'records');

//     // Summary statistics
//     const summary = {
//       total: results.length,
//       hadir: results.filter(r => r.status_presensi === 'Hadir').length,
//       tidak_hadir: results.filter(r => r.status_presensi === 'Tidak Hadir').length,
//       izin: results.filter(r => r.status_presensi === 'Izin').length,
//       sakit: results.filter(r => r.status_presensi === 'Sakit').length
//     };

//     res.json({
//       tanggal: tanggal || new Date().toISOString().split('T')[0],
//       nama_kelas: results.length > 0 ? results[0].nama_kelas : null,
//       summary: summary,
//       data: results
//     });
//   });
// });

// // Cleanup saat aplikasi ditutup
// process.on('SIGINT', () => {
//   console.log('Cleaning up refresh timers...');
//   refreshTimers.forEach((timer, kelas_id) => {
//     clearInterval(timer);
//     console.log(`Timer untuk kelas ${kelas_id} dihentikan`);
//   });
//   refreshTimers.clear();
//   process.exit(0);
// });

// process.on('SIGTERM', () => {
//   console.log('Cleaning up refresh timers...');
//   refreshTimers.forEach((timer, kelas_id) => {
//     clearInterval(timer);
//     console.log(`Timer untuk kelas ${kelas_id} dihentikan`);
//   });
//   refreshTimers.clear();
//   process.exit(0);
// });

module.exports = router;