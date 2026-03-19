import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        booking_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            index: true,
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        provider_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        amount: { type: Number, required: true },
        currency: { type: String, default: "USD" },

        method: {
            type: String,
            enum: ["card_demo", "apple_pay_demo", "zelle_demo"],
            required: true,
        },

        status: {
            type: String,
            enum: ["initiated", "paid", "failed", "refunded"],
            default: "initiated",
            index: true,
        },

        // IMPORTANT: allow null, not ""
        // make unique+sparse so only real refs must be unique
        transaction_ref: { type: String, default: null, unique: true, sparse: true },

        paid_at: { type: Date, default: null },
        refunded_at: { type: Date, default: null },
    },
    { timestamps: true }
);

// IMPORTANT: avoid nodemon "Cannot overwrite model once compiled"
export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);