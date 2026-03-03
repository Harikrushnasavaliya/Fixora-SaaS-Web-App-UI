import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    category_name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    icon: { type: String, maxlength: 100 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const Category = mongoose.model("Category", categorySchema);