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

    decision: {
      type: String,
      enum: ["pending", "accepted", "rejected", null],
      default: null,
    },

    pricing_type: {
      type: String,
      enum: ["hourly", "fixed"],
      default: "fixed",
    },
    estimated_hours: { type: Number, default: 1, min: 1 },

    reschedule: {
      requested: { type: Boolean, default: false },
      proposed_date: { type: String, default: null },
      proposed_time: { type: String, default: null },
      reason: { type: String, default: "" },
      requested_by: {
        type: String,
        enum: ["provider", "customer", null],
        default: null,
      },
      rejection_reason: { type: String, default: "" },
      rejection_message: { type: String, default: "" },
      previous_status: { type: String, default: null },
      decision: {
        type: String,
        enum: ["pending", "accepted", "rejected", null],
        default: null,
      },
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);