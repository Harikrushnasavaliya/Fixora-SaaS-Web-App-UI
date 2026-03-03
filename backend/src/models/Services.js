import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    service_name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const Service = mongoose.model("Service", serviceSchema);