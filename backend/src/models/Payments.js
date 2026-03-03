import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true, index: true },
    amount: { type: Number, min: 0, required: true },
    payment_method: { type: String, enum: ["card", "wallet", "cash"], required: true },
    payment_status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
    transaction_ref: { type: String, unique: true, sparse: true, maxlength: 255 },
    paid_at: { type: Date },
  },
  { timestamps: false }
);

export const Payment = mongoose.model("Payment", paymentSchema);