import mongoose from "mongoose";

const providerProfileSchema = new mongoose.Schema(
  {
    provider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },
    bio: { type: String, default: "" },
    experience_years: { type: Number, min: 0, default: 0 },
    base_price: { type: Number, min: 0, default: 0 },

    rating_avg: { type: Number, default: 0, min: 0 },
    total_reviews: { type: Number, default: 0, min: 0 },

    is_verified: { type: Boolean, default: false, index: true },
    available_status: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const ProviderProfile = mongoose.model("ProviderProfile", providerProfileSchema);