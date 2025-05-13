require("dotenv").config();
const session = require("express-session");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

const app = express();

// Middleware untuk logging
app.use(morgan("dev"));

// Health check endpoint untuk Azure (PENTING!)
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Ping endpoint untuk keep-alive
app.get("/ping", (req, res) => {
  console.log(`[${new Date().toISOString()}] Ping received`);
  res.status(200).send("pong");
});

// Get allowed origins from env variables
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === "production") {
    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',');
    }
    return [process.env.FRONTEND_URL || "https://your-azure-frontend-app.azurewebsites.net"];
  }
  return ["http://localhost:3000", "http://localhost:5173"];
};

// Konfigurasi CORS
app.use(
  cors({
    origin: getAllowedOrigins(),
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

// Routes dengan logging
app.use("/api/auth", (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Auth route accessed: ${req.method} ${req.path}`);
  next();
}, authRoutes);

app.use("/api/admin", (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Admin route accessed: ${req.method} ${req.path}`);
  next();
}, adminRoutes);

app.use("/api/attendance", (req, res, next) => {
  console.log(`[${new Date().toISOString()}] Attendance route accessed: ${req.method} ${req.path}`);
  next();
}, attendanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, err);
  res.status(500).json({
    message: "Terjadi kesalahan server",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error",
    timestamp
  });
});

// Catch 404 dan log
app.use((req, res) => {
  console.log(`[${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: "Route tidak ditemukan",
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Server startup dengan interval ping
const server = app.listen(PORT, () => {
  const startupTime = new Date().toISOString();
  console.log(`[${startupTime}] Server berjalan di port ${PORT}`);
  console.log(`[${startupTime}] Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Kirim log setiap 30 detik untuk mencegah "No new trace"
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Server health check - OK`);
  }, 30000);
});

// Handle shutdown dengan baik
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received - Shutting down gracefully`);
  server.close(() => {
    console.log(`[${new Date().toISOString()}] Server closed`);
    process.exit(0);
  });
});