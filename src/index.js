const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Swagger Setup
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
const authRoutes = require('./routes/authRoutes');
const siswaRoutes = require('./routes/siswaRoutes');
const guruRoutes = require('./routes/guruRoutes');
 const mataKuliahRoutes = require('./routes/matkulRoutes');
const kelasRoutes = require('./routes/kelasRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const gurupresensiRoutes = require('./routes/gurupresensiRoutes');
const siswapresensiRoutes = require('./routes/siswapresensiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/siswa', siswaRoutes);
app.use('/api/matkul', mataKuliahRoutes);
app.use('/api/guru', guruRoutes);
app.use('/api/kelas', kelasRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/presensi-guru', gurupresensiRoutes);
app.use('/api/presensi-siswa', siswapresensiRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
