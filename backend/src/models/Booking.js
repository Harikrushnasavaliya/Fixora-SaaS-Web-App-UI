import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },

    date: { type: String, required: true }, // "2026-03-12"
    time: { type: String, required: true }, // "10:30"
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);