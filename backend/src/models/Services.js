import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    service_name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "" },

    price: { type: Number, required: true, min: 0 },

    // ✅ important for your list filter
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Service = mongoose.model("Service", serviceSchema);