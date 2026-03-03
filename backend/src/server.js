import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
// import authRoutes from "./routes/auth.route.js";
// import categoryRoutes from "./routes/categories.route.js";
// import serviceRoutes from "./routes/services.routes.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import serviceRoutes from "./routes/services.routes.js";
// import bookingRoutes from "./routes/bookings.routes.js";
// import providerRoutes from "./routes/providers.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.get("/", (req, res) => res.send("Fixora API ✅"));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/providers", providerRoutes);

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`✅ Server on ${PORT}`)))
  .catch((e) => {
    console.error("❌ DB fail:", e.message);
    process.exit(1);
  });