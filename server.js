require("dotenv").config();
const session = require("express-session");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Validasi konfigurasi database
let authRoutes, adminRoutes, attendanceRoutes;

try {
  console.log("Loading routes...");
  authRoutes = require("./routes/authRoutes");
  adminRoutes = require("./routes/adminRoutes");
  attendanceRoutes = require("./routes/attendanceRoutes");
  console.log("Routes loaded successfully");
} catch (error) {
  console.error("Error loading routes:", error);
}

const app = express();

// Custom logging middleware untuk Azure
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware untuk logging
app.use(morgan("dev"));

// Health check endpoint untuk Azure (PENTING!)
app.get("/", (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check called`);
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Debug info endpoint
app.get("/debug", (req, res) => {
  console.log(`[${new Date().toISOString()}] Debug info requested`);
  res.status(200).json({
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'not set',
      DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
      DB_USER: process.env.DB_USER ? 'set' : 'not set'
    },
    timestamp: new Date().toISOString()
  });
});

// Get allowed origins from env variables
const getAllowedOrigins = () => {
  console.log(`[${new Date().toISOString()}] CORS configuration: NODE_ENV=${process.env.NODE_ENV}`);
  
  if (process.env.NODE_ENV === "production") {
    if (process.env.ALLOWED_ORIGINS) {
      console.log(`Using ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS}`);
      return process.env.ALLOWED_ORIGINS.split(',');
    }
    const frontendUrl = process.env.FRONTEND_URL || "https://brown-rail-652226.hostingersite.com/";
    console.log(`Using FRONTEND_URL: ${frontendUrl}`);
    return [frontendUrl];
  }
  console.log("Using development origins");
  return ["*"]; // Development mode - allow all origins for testing
};

// Konfigurasi CORS
try {
  const origins = getAllowedOrigins();
  console.log(`[${new Date().toISOString()}] Configuring CORS with origins:`, origins);
  
  app.use(
    cors({
      origin: origins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
  console.log(`[${new Date().toISOString()}] CORS configured successfully`);
} catch (error) {
  console.error(`[${new Date().toISOString()}] CORS configuration error:`, error);
}

// Konfigurasi body parser
console.log(`[${new Date().toISOString()}] Configuring body parsers`);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi session - dengan validasi
console.log(`[${new Date().toISOString()}] Configuring session`);
const sessionSecret = process.env.SESSION_SECRET || "rahasia";
console.log(`[${new Date().toISOString()}] Session secret length: ${sessionSecret.length} chars`);

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 jam
    },
  })
);

// Mount routes if available
if (authRoutes) {
  app.use("/api/auth", (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Auth route: ${req.method} ${req.path}`);
    next();
  }, authRoutes);
} else {
  console.warn(`[${new Date().toISOString()}] Warning: authRoutes not available`);
  app.use("/api/auth", (req, res) => {
    res.status(503).json({ message: "Auth routes not available" });
  });
}

if (adminRoutes) {
  app.use("/api/admin", (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Admin route: ${req.method} ${req.path}`);
    next();
  }, adminRoutes);
} else {
  console.warn(`[${new Date().toISOString()}] Warning: adminRoutes not available`);
  app.use("/api/admin", (req, res) => {
    res.status(503).json({ message: "Admin routes not available" });
  });
}

if (attendanceRoutes) {
  app.use("/api/attendance", (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Attendance route: ${req.method} ${req.path}`);
    next();
  }, attendanceRoutes);
} else {
  console.warn(`[${new Date().toISOString()}] Warning: attendanceRoutes not available`);
  app.use("/api/attendance", (req, res) => {
    res.status(503).json({ message: "Attendance routes not available" });
  });
}

// Error handling middleware with more details
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
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

// Server startup dengan error handling
const PORT = process.env.PORT || 5000;

try {
  console.log(`[${new Date().toISOString()}] Starting server...`);
  const server = app.listen(PORT, () => {
    const startupTime = new Date().toISOString();
    console.log(`[${startupTime}] Server berjalan di port ${PORT}`);
    console.log(`[${startupTime}] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${startupTime}] Health check tersedia di / dan /debug`);
    
    // Log ping setiap 30 detik untuk mencegah "No new trace"
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
} catch (error) {
  console.error(`[${new Date().toISOString()}] FATAL ERROR starting server:`, error);
}