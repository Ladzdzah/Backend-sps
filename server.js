require("dotenv").config();
const session = require("express-session");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
<<<<<<< HEAD
=======
const MySQLStore = require('express-mysql-session')(session);
>>>>>>> f41b178 (first commit)
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

const app = express();

<<<<<<< HEAD
=======
// Session store options
const options = {
  host: process.env.DB_HOST || 'srv1155.hstgr.io',
  port: 3306,
  user: process.env.DB_USER || 'u344296107_ladzdzah',
  password: process.env.DB_PASS || 'Mufidz69.ladzdzah',
  database: process.env.DB_NAME || 'u344296107_db_absensi',
  createDatabaseTable: true, // Membuat tabel sessions secara otomatis
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
};

// Initialize session store
const sessionStore = new MySQLStore(options);

>>>>>>> f41b178 (first commit)
// Middleware untuk logging
app.use(morgan("dev"));

// Konfigurasi CORS
app.use(
  cors({
<<<<<<< HEAD
    origin: [
      "http://localhost:3000", 
      "http://localhost:5173",
      "https://brown-rail-652226.hostingersite.com"
    ],
=======
    origin: ["http://localhost:3000", "http://localhost:5173", "https://brown-rail-652226.hostingersite.com"],
>>>>>>> f41b178 (first commit)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Konfigurasi body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

<<<<<<< HEAD
// Konfigurasi session
app.use(
  session({
=======
// Konfigurasi session dengan MySQL store
app.use(
  session({
    store: sessionStore, // Menggunakan MySQL store
>>>>>>> f41b178 (first commit)
    secret: process.env.SESSION_SECRET || "rahasia",
    resave: false,
    saveUninitialized: false,
    cookie: {
<<<<<<< HEAD
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
=======
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
      httpOnly: true
>>>>>>> f41b178 (first commit)
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

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