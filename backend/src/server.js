import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import serviceRoutes from "./routes/services.routes.js";
import bookingRoutes from "./routes/bookings.routes.js";
import providerRoutes from "./routes/providers.routes.js";
import paymentRoutes from "./routes/payments.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Fixora API ✅"));

// ✅ DEBUG FIRST (must be before app.use routes)
console.log("authRoutes:", typeof authRoutes);
console.log("categoryRoutes:", typeof categoryRoutes);
console.log("serviceRoutes:", typeof serviceRoutes);
console.log("bookingRoutes:", typeof bookingRoutes);
console.log("providerRoutes:", typeof providerRoutes);
console.log("paymentRoutes:", typeof paymentRoutes);
console.log("reviewRoutes:", typeof reviewRoutes);
console.log("adminRoutes:", typeof adminRoutes);

// ✅ Mount routes ONLY if they are functions
if (typeof authRoutes === "function") app.use("/api/auth", authRoutes);
if (typeof categoryRoutes === "function") app.use("/api/categories", categoryRoutes);
if (typeof serviceRoutes === "function") app.use("/api/services", serviceRoutes);
if (typeof bookingRoutes === "function") app.use("/api/bookings", bookingRoutes);
if (typeof providerRoutes === "function") app.use("/api/providers", providerRoutes);
if (typeof paymentRoutes === "function") app.use("/api/payments", paymentRoutes);
if (typeof reviewRoutes === "function") app.use("/api/reviews", reviewRoutes);
if (typeof adminRoutes === "function") app.use("/api/admin", adminRoutes);
console.log("✅ Auth routes mounted at /api/auth");
// 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// error handler
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`✅ Server on ${PORT}`)))
  .catch((e) => {
    console.error("❌ DB fail:", e.message);
    process.exit(1);
  });

export default app;