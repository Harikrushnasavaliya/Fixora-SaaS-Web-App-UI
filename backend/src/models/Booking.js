import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true, index: true },

    booking_date: { type: Date, required: true, index: true }, // store date as Date
    booking_time: { type: String }, // keep "HH:mm" if you want simple UI handling

    total_amount: { type: Number, min: 0 },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending", index: true },

    address: { type: String, maxlength: 255 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const Booking = mongoose.model("Booking", bookingSchema);