import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        provider_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

        amount: { type: Number, required: true },
        currency: { type: String, default: "USD" },

        method: { type: String, enum: ["card_demo", "apple_pay_demo", "zelle_demo"], required: true },
        status: { type: String, enum: ["initiated", "paid", "failed", "refunded"], default: "initiated", index: true },

        transaction_ref: { type: String, default: "" },
        paid_at: { type: Date },
        refunded_at: { type: Date },
    },
    { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);