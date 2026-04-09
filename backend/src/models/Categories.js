import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    category_name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);