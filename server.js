require("dotenv").config();
const session = require("express-session");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

const app = express();

// Tambahkan di paling atas agar seluruh proses Node.js pakai zona waktu lokal
process.env.TZ = 'Asia/Jakarta';

// Middleware untuk logging
app.use(morgan("dev"));

// Konfigurasi CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "https://absenspstpqalikhlas.site"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Konfigurasi body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.send("Backend ABS-SPS is running.");
});

// Tambahkan endpoint untuk mendapatkan waktu server
app.get('/api/server-time', (req, res) => {
  const now = new Date();
  console.log('Server time (Asia/Jakarta):', now.toString());
  res.json({ serverTime: now.toISOString(), local: now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Terjadi kesalahan server",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});