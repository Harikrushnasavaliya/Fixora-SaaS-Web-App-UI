import { Payment } from "../models/Payments.js";
import { Booking } from "../models/Booking.js";

export async function createPayment(req, res) {
  try {
    const { booking_id, amount, payment_method, transaction_ref } = req.body;

    if (!booking_id || !amount || !payment_method) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only customer who owns booking can pay
    if (req.user.role === "customer" && String(booking.customer_id) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const payment = await Payment.create({
      booking_id,
      amount: Number(amount),
      payment_method, // card/wallet/cash
      payment_status: "paid",
      transaction_ref: transaction_ref || `TXN_${Date.now()}`,
      paid_at: new Date(),
    });

    return res.status(201).json(payment);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function getPaymentByBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const payment = await Payment.findOne({ booking_id: bookingId }).lean();
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    return res.json(payment);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}