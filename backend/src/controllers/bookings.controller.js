import { Booking } from "../models/Booking.js";
import { User } from "../models/Users.js";
import { Service } from "../models/Services.js";

export async function createBooking(req, res) {
  try {
    const customer_id = req.user.id;
    const { provider_id, service_id, booking_date, booking_time, address, total_amount } = req.body;

    if (!provider_id || !service_id || !booking_date) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // basic validation
    const provider = await User.findOne({ _id: provider_id, role: "provider" });
    if (!provider) return res.status(404).json({ message: "Provider not found" });

    const service = await Service.findById(service_id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const booking = await Booking.create({
      customer_id,
      provider_id,
      service_id,
      booking_date: new Date(booking_date),
      booking_time,
      total_amount: Number(total_amount || 0),
      status: "pending",
      address,
    });

    return res.status(201).json(booking);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function myBookings(req, res) {
  try {
    const customer_id = req.user.id;

    const bookings = await Booking.find({ customer_id })
      .populate("provider_id", "full_name profile_image")
      .populate("service_id", "service_name")
      .sort({ booking_date: -1 })
      .lean();

    return res.json(bookings);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function providerJobs(req, res) {
  try {
    const provider_id = req.user.id;

    const jobs = await Booking.find({ provider_id })
      .populate("customer_id", "full_name")
      .populate("service_id", "service_name")
      .sort({ booking_date: -1 })
      .lean();

    return res.json(jobs);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

// Provider can accept/reject/complete; Customer can only set cancel via cancel route
export async function updateBookingStatus(req, res) {
  try {
    const bookingId = req.params.id;
    const { status } = req.body; // pending/confirmed/completed/cancelled

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Authorization: provider must own booking
    if (req.user.role === "provider" && String(booking.provider_id) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    booking.status = status;
    await booking.save();

    return res.json(booking);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function cancelBooking(req, res) {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // customer must own booking
    if (req.user.role === "customer" && String(booking.customer_id) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.json(booking);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}