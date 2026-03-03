import mongoose from "mongoose";
const locationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    address_line: { type: String, maxlength: 255 },
    city: { type: String, index: true, maxlength: 100 },
    state: { type: String, maxlength: 100 },
    country: { type: String, maxlength: 100 },
    postal_code: { type: String, maxlength: 20 },

    // GeoJSON point: [lng, lat]
    geo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

locationSchema.index({ geo: "2dsphere" });

export const Location = mongoose.model("Location", locationSchema);