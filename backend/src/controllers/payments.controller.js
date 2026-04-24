import crypto from "crypto";
import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payment.js";
import { Service } from "../models/Services.js";
import { User } from "../models/Users.js";
import {
    emitPaymentSucceeded,
    emitPaymentFailed,
    emitPaymentRefunded,
} from "../socket/emitters.js";

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function makeTxnRef() {
    return `TXN_DEMO_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

// POST /api/payments/intent
export async function createDemoPaymentIntent(req, res) {
    try {
        const userId = req.user.id;
        const { booking_id, method } = req.body;

        if (!booking_id || !method) return res.status(400).json({ message: "booking_id and method are required" });
        if (!["card_demo", "apple_pay_demo", "zelle_demo"].includes(method)) {
            return res.status(400).json({ message: "Invalid method" });
        }
        if (!isValidObjectId(booking_id)) return res.status(400).json({ message: "Invalid booking_id" });

        const user = await User.findById(userId).select("_id role");
        if (!user || user.role !== "customer") return res.status(403).json({ message: "Only customers can pay" });

        const booking = await Booking.findOne({ _id: booking_id, customer_id: userId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Only allow payment after provider completed work
        if (booking.status !== "work_completed") {
            return res.status(400).json({
                message: "Payment available only after provider completes work",
                code: "PAYMENT_NOT_ALLOWED_YET",
                booking_status: booking.status,
            });
        }

        if (booking.payment_status === "paid") {
            return res.status(400).json({ message: "Already paid" });
        }

        // Ensure amount exists
        let amount = Number(booking.total_amount || 0);
        if (!amount || amount <= 0) {
            const svc = await Service.findById(booking.service_id).select("price");
            amount = Number(svc?.price || 0);
            booking.total_amount = amount;
            await booking.save();
        }
        if (!amount || amount <= 0) return res.status(400).json({ message: "Service amount not set" });

        // reuse initiated payment (avoid duplicates)
        const existing = await Payment.findOne({ booking_id: booking._id, status: "initiated" });
        if (existing) {
            return res.json({
                payment_id: existing._id,
                client_secret: `demo_secret_${existing._id}`,
                amount: existing.amount,
                currency: existing.currency,
            });
        }

        const payment = await Payment.create({
            booking_id: booking._id,
            customer_id: booking.customer_id,
            provider_id: booking.provider_id,
            amount,
            currency: booking.currency || "USD",
            method,
            status: "initiated",
            transaction_ref: null, // IMPORTANT
        });

        return res.json({
            payment_id: payment._id,
            client_secret: `demo_secret_${payment._id}`,
            amount: payment.amount,
            currency: payment.currency,
        });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function confirmDemoPayment(req, res) {
    try {
        const userId = req.user.id;
        const { payment_id, client_secret, simulate } = req.body;

        if (!payment_id || !client_secret) {
            return res.status(400).json({ message: "payment_id and client_secret are required" });
        }
        if (!isValidObjectId(payment_id)) return res.status(400).json({ message: "Invalid payment_id" });

        const user = await User.findById(userId).select("_id role");
        if (!user || user.role !== "customer") {
            return res.status(403).json({ message: "Only customers can confirm payment" });
        }

        const payment = await Payment.findOne({ _id: payment_id, customer_id: userId });
        if (!payment) return res.status(404).json({ message: "Payment not found" });

        if (payment.status === "paid") {
            return res.json({ message: "Already paid", payment });
        }

        if (client_secret !== `demo_secret_${payment._id}`) {
            return res.status(400).json({ message: "Invalid client_secret" });
        }

        const booking = await Booking.findById(payment.booking_id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (String(booking.customer_id) !== String(userId)) {
            return res.status(403).json({ message: "Not your booking" });
        }

        if (booking.status !== "work_completed") {
            return res.status(400).json({
                message: "Payment available only after provider completes work",
                code: "PAYMENT_NOT_ALLOWED_YET",
                booking_status: booking.status,
            });
        }

        const shouldFail = String(simulate || "").toLowerCase() === "fail";
        if (shouldFail) {
            payment.status = "failed";
            await payment.save();

            booking.payment_status = "failed";
            await booking.save();

            emitPaymentFailed(payment);

            return res.status(400).json({ message: "Demo payment failed", payment });
        }

        payment.status = "paid";
        payment.transaction_ref = makeTxnRef(); // now unique
        payment.paid_at = new Date();
        await payment.save();

        // ✅ After payment -> booking becomes completed (moves to Past)
        booking.payment_status = "paid";
        booking.status = "completed";
        await booking.save();

        emitPaymentSucceeded(payment, booking);

        return res.json({ message: "Demo payment success", payment, booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function myPayments(req, res) {
    try {
        const userId = req.user.id;
        const payments = await Payment.find({ customer_id: userId })
            .sort({ createdAt: -1 })
            .populate("booking_id", "date time status payment_status total_amount currency")
            .populate("provider_id", "full_name email")
            .lean();

        return res.json({ payments });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function adminRefundDemoPayment(req, res) {
    try {
        const adminId = req.user.id;
        const { payment_id } = req.params;

        if (!isValidObjectId(payment_id)) return res.status(400).json({ message: "Invalid payment_id" });

        const admin = await User.findById(adminId).select("_id role");
        if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Only admin can refund" });

        const payment = await Payment.findById(payment_id);
        if (!payment) return res.status(404).json({ message: "Payment not found" });
        if (payment.status !== "paid") return res.status(400).json({ message: "Only paid payments can be refunded" });

        payment.status = "refunded";
        payment.refunded_at = new Date();
        await payment.save();

        await Booking.updateOne(
            { _id: payment.booking_id },
            { $set: { payment_status: "refunded", status: "cancelled" } }
        );

        emitPaymentRefunded(payment);

        return res.json({ message: "Refunded (demo)", payment });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}
