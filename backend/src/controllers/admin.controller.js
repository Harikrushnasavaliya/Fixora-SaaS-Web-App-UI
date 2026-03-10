import { User } from "../models/Users.js";
import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payments.js";

export async function getMetrics(req, res) {
  try {
    const [totalUsers, totalProviders, totalCustomers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "provider" }),
      User.countDocuments({ role: "customer" }),
    ]);

    const [totalBookings, completedBookings, cancelledBookings] = await Promise.all([
      Booking.countDocuments({}),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
    ]);

    const payments = await Payment.aggregate([
      { $match: { payment_status: "paid" } },
      { $group: { _id: null, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const revenue = payments[0]?.revenue || 0;
    const paymentCount = payments[0]?.count || 0;

    // simple commission example: 10%
    const commissionRate = 0.1;
    const commission = revenue * commissionRate;

    return res.json({
      users: { totalUsers, totalProviders, totalCustomers },
      bookings: { totalBookings, completedBookings, cancelledBookings },
      payments: { revenue, paymentCount, commission, commissionRate },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}