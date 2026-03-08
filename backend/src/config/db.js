import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB || "fixora";
  if (!uri) throw new Error("MONGO_URI missing");

  await mongoose.connect(uri, { dbName });
  console.log(`✅ MongoDB connected (${dbName})`);
}