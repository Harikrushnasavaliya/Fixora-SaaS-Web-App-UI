import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/Users.js";
// import { Category } from "../models/Category.js";
// import { Service } from "../models/Service.js";

dotenv.config();

async function seed() {
  await connectDB();

  // DEV reset (comment out if you don’t want to delete)
  await Promise.all([
    User.deleteMany({}),
    // Category.deleteMany({}),
    // Service.deleteMany({}),
  ]);

  // // 1) Categories
  // const categories = await Category.insertMany([
  //   { category_name: "Plumbing", icon: "plumbing" },
  //   { category_name: "Electrical", icon: "electrical" },
  //   { category_name: "Cleaning", icon: "cleaning" },
  //   { category_name: "Appliance Repair", icon: "appliance" },
  //   { category_name: "Handyman", icon: "handyman" },
  // ]);

  // const catByName = Object.fromEntries(categories.map(c => [c.category_name, c._id]));

  // // 2) Services
  // await Service.insertMany([
  //   { category_id: catByName["Plumbing"], service_name: "Leak Fix", description: "Fix leaking pipes, taps, and joints" },
  //   { category_id: catByName["Plumbing"], service_name: "Drain Cleaning", description: "Unclog sinks and drains" },

  //   { category_id: catByName["Electrical"], service_name: "Switch/Socket Repair", description: "Repair or replace switches and sockets" },
  //   { category_id: catByName["Electrical"], service_name: "Fan/Light Installation", description: "Install ceiling fan or light fixture" },

  //   { category_id: catByName["Cleaning"], service_name: "Home Deep Cleaning", description: "Full house deep cleaning" },
  //   { category_id: catByName["Cleaning"], service_name: "Kitchen Cleaning", description: "Kitchen and appliance cleaning" },

  //   { category_id: catByName["Appliance Repair"], service_name: "Washing Machine Repair", description: "Diagnose and repair washing machines" },
  //   { category_id: catByName["Appliance Repair"], service_name: "Refrigerator Repair", description: "Cooling issues, compressor, leaks" },

  //   { category_id: catByName["Handyman"], service_name: "Furniture Assembly", description: "Assemble basic furniture" },
  //   { category_id: catByName["Handyman"], service_name: "Wall Mounting", description: "Mount TV, frames, shelves" },
  // ]);

  // 3) Admin user (password_hash is dummy for now)
  await User.create({
    full_name: "lele Admin",
    email: "admin@fixora.com",
    phone: "9000000000",
    password_hash: "dummyhash_replace_later",
    role: "admin",
    is_active: true,
  });

  console.log("✅ Seed completed: categories, services, admin user inserted");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});