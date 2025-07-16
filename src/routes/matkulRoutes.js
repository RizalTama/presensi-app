const express = require("express");
const router = express.Router();
const db = require("../config/database");

/**
 * @swagger
 * tags:
 *   name: Mata Kuliah
 *   description: API untuk manajemen data mata kuliah
 * components:
 *   schemas:
 *     MataKuliah:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nama_matkul:
 *           type: string
 *         kode_matkul:
 *           type: string
 *         jurusan:
 *           type: string
 *         pertemuan:
 *           type: integer
 *         deskripsi:
 *           type: string
 *     NewMataKuliah:
 *       type: object
 *       required:
 *         - id
 *         - nama_matkul
 *         - kode_matkul
 *         - jurusan
 *         - pertemuan
 *       properties:
 *         id:
 *           type: integer
 *         nama_matkul:
 *           type: string
 *         kode_matkul:
 *           type: string
 *         jurusan:
 *           type: string
 *         pertemuan:
 *           type: integer
 *         deskripsi:
 *           type: string
 */

// GET semua mata kuliah
/**
 * @swagger
 * /api/matkul:
 *   get:
 *     summary: Mengambil semua data mata kuliah
 *     tags: [Mata Kuliah]
 *     responses:
 *       200:
 *         description: Daftar semua mata kuliah.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MataKuliah'
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get("/", (req, res) => {
  const sql = "SELECT * FROM Mata_Kuliah";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error querying the database" });
    }
    res.json(results);
  });
});

// GET mata kuliah berdasarkan ID
/**
 * @swagger
 * /api/matkul/{id}:
 *   get:
 *     summary: Mengambil data mata kuliah berdasarkan ID
 *     tags: [Mata Kuliah]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Mata Kuliah
 *     responses:
 *       200:
 *         description: Data mata kuliah.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MataKuliah'
 *       404:
 *         description: Mata kuliah tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: "ID harus bertipe integer" });
  }

  const sql = "SELECT * FROM Mata_Kuliah WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error querying the database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Mata Kuliah not found" });
    }

    res.json(results[0]);
  });
});

// POST (Tambah Mata Kuliah)
/**
 * @swagger
 * /api/matkul:
 *   post:
 *     summary: Menambahkan mata kuliah baru
 *     tags: [Mata Kuliah]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewMataKuliah'
 *     responses:
 *       201:
 *         description: Mata kuliah berhasil ditambahkan.
 *       400:
 *         description: ID sudah terpakai.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.post("/", (req, res) => {
  const { id, nama_matkul, kode_matkul, jurusan, pertemuan, deskripsi } =
    req.body;

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: "ID harus bertipe integer" });
  }

  // Cek apakah ID sudah terpakai
  const sqlCheckId = "SELECT * FROM Mata_Kuliah WHERE id = ?";
  db.query(sqlCheckId, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error querying the database" });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "ID sudah terpakai" });
    }

    // Jika ID belum terpakai, lanjutkan dengan insert data
    const sql =
      "INSERT INTO Mata_Kuliah (id, nama_matkul, kode_matkul, jurusan, pertemuan, deskripsi) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [id, nama_matkul, kode_matkul, jurusan, pertemuan, deskripsi],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error adding mata kuliah" });
        }

        // Mengambil ID mata kuliah yang baru dimasukkan
        const sqlGetId = "SELECT id FROM Mata_Kuliah WHERE id = ?";
        db.query(sqlGetId, [id], (err, resultsGetId) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .json({ message: "Error fetching mata kuliah ID" });
          }

          // Mengembalikan response dengan ID yang benar
          res.status(201).json({
            message: "Mata Kuliah added successfully",
            matkulId: resultsGetId[0].id, // Menyertakan ID yang benar dari database
          });
        });
      }
    );
  });
});

// PUT (Update Mata Kuliah)
/**
 * @swagger
 * /api/matkul/{id}:
 *   put:
 *     summary: Memperbarui data mata kuliah
 *     tags: [Mata Kuliah]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Mata Kuliah
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_matkul:
 *                 type: string
 *               kode_matkul:
 *                 type: string
 *               jurusan:
 *                 type: string
 *               pertemuan:
 *                 type: integer
 *               deskripsi:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mata kuliah berhasil diperbarui.
 *       404:
 *         description: Mata kuliah tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.put("/:id", (req, res) => {
  const { id } = req.params;

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: "ID harus bertipe integer" });
  }

  const { nama_matkul, kode_matkul, jurusan, pertemuan, deskripsi } = req.body;

  const sql =
    "UPDATE Mata_Kuliah SET nama_matkul = ?, kode_matkul = ?, jurusan = ?, pertemuan = ?, deskripsi = ? WHERE id = ?";
  db.query(
    sql,
    [nama_matkul, kode_matkul, jurusan, pertemuan, deskripsi, id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Error updating mata kuliah" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Mata Kuliah not found" });
      }

      res.json({ message: "Mata Kuliah updated successfully" });
    }
  );
});

// DELETE (Hapus Mata Kuliah)
/**
 * @swagger
 * /api/matkul/{id}:
 *   delete:
 *     summary: Menghapus data mata kuliah
 *     tags: [Mata Kuliah]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID Mata Kuliah
 *     responses:
 *       200:
 *         description: Mata kuliah berhasil dihapus.
 *       404:
 *         description: Mata kuliah tidak ditemukan.
 *       500:
 *         description: Terjadi kesalahan pada server.
 */
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // Validasi ID harus integer
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: "ID harus bertipe integer" });
  }

  const sql = "DELETE FROM Mata_Kuliah WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error deleting mata kuliah" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Mata Kuliah not found" });
    }

    res.json({ message: "Mata Kuliah deleted successfully" });
  });
});

module.exports = router;
