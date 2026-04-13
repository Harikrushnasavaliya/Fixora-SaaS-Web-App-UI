import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import serviceRoutes from "./routes/services.routes.js";
import bookingRoutes from "./routes/bookings.routes.js";
import providerRoutes from "./routes/provider.routes.js";
import seedAdmin from "./seeds/seed.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payments.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import issueRoutes from "./routes/issues.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://3.145.26.198:3000",
  "http://3.145.26.198:3001",
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

// ✅ Socket.io setup
export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ✅ Socket.io events
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Provider joins a booking room
  socket.on("join_booking", ({ bookingId, role }) => {
    socket.join(`booking_${bookingId}`);
    console.log(`${role} joined room: booking_${bookingId}`);
  });

  // Provider sends location update
  socket.on("provider_location", ({ bookingId, lat, lng }) => {
    // Broadcast to all in booking room except sender
    socket.to(`booking_${bookingId}`).emit("location_update", { lat, lng });
    console.log(`📍 Location update for booking ${bookingId}: ${lat}, ${lng}`);
  });

  // Provider marks as arrived
  socket.on("provider_arrived", ({ bookingId }) => {
    io.to(`booking_${bookingId}`).emit("provider_arrived", { bookingId });
  });

  socket.on("disconnect", () => {
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

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
app.use("/api/reviews", reviewRoutes);
app.use("/api/issues", issueRoutes);
app.get("/api/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5001;

connectDB()
  .then(async () => {
    if (process.env.NODE_ENV !== "production") {
      await seedAdmin();
    }
    // ✅ Use httpServer instead of app.listen
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((e) => {
    console.error("DB connection failed:", e.message);
    process.exit(1);
  });