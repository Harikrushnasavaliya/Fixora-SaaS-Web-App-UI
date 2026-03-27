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
import providerRoutes from "./routes/provider.routes.js";
import seedAdmin from "./seeds/seed.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payments.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://3.145.26.198:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("/*splat", cors());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.get("/", (req, res) => res.send("Fixora API"));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.get("/api/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5001;

connectDB()
  .then(async () => {
    if (process.env.NODE_ENV !== "production") {
      await seedAdmin();
    }
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((e) => {
    console.error("DB connection failed:", e.message);
    process.exit(1);
  });