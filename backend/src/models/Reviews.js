import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true, index: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true, index: true },
    comment: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const Review = mongoose.model("Review", reviewSchema);