import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import serviceRoutes from "./routes/services.routes.js";
import bookingRoutes from "./routes/bookings.routes.js";

// ✅ ALWAYS load backend/.env correctly (PM2 safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// If you run behind a proxy (Render/Nginx), keep this. Safe locally too.
app.set("trust proxy", 1);

// ✅ CORS: use ONLY ONE cors() middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://3.145.26.198:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (curl/postman) with no origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Fixora API ✅"));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`✅ Server on ${PORT}`)))
  .catch((e) => {
    console.error("❌ DB fail:", e.message);
    process.exit(1);
  });