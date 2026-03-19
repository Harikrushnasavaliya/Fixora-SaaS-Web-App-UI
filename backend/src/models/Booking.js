import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },

    date: { type: String, required: true },
    time: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },

    total_amount: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },

    status: {
      type: String,
      enum: [
        "pending",                 // customer created
        "confirmed",               // provider accepted
        "rejected",
        "cancelled",
        "work_completed",          // provider finished work -> customer can pay
        "completed",               // after payment success
        "reschedule_requested",    // provider/customer requested change
      ],
      default: "pending",
      index: true,
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    reschedule: {
      requested: { type: Boolean, default: false },
      requested_by: { type: String, enum: ["provider", "customer"], default: "provider" },
      previous_status: {
        type: String,
        enum: ["pending", "confirmed", "rejected", "cancelled", "work_completed", "completed"],
        default: "pending",
      },
      proposed_date: { type: String, default: "" },
      proposed_time: { type: String, default: "" },
      reason: { type: String, default: "" },
      requested_at: { type: Date, default: null },
      decided_at: { type: Date, default: null },
      customer_message: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);