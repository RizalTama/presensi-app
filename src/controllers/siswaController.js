const db = require('../config/database');

const getAllSiswa = (req, res) => {
  db.query('SELECT * FROM Siswa', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(results);
  });
};

const getSiswaById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM Siswa WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(404).json({ message: 'Siswa not found' });
    }
  });
};

module.exports = { getAllSiswa, getSiswaById };
