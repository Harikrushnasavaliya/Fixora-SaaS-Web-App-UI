import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { User } from "./models/Users.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// app.get("/", (req, res) => res.send("Fixora backend running ✅"));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

app.get("/test-user", async (req, res) => {
  const user = await User.create({
    full_name: "Test User",
    email: "test@fixora.com",
    phone: "9999999999",
    password_hash: "dummyhash",
    role: "customer",
  });

  res.json(user);
});