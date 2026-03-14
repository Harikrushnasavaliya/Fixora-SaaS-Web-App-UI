import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { User } from "../models/Users.js";
import { Service } from "../models/Services.js";

export async function createBooking(req, res) {
    try {
        const customerId = req.user.id;

        const { provider_id, service_id, date, time, address, notes } = req.body;

        if (!provider_id || !service_id || !date || !time || !address) {
            return res.status(400).json({ message: "Missing fields" });
        }

        // validate ids
        if (!mongoose.Types.ObjectId.isValid(provider_id) || !mongoose.Types.ObjectId.isValid(service_id)) {
            return res.status(400).json({ message: "Invalid provider/service id" });
        }

        // ensure customer exists
        const customer = await User.findById(customerId).select("_id role");
        if (!customer || customer.role !== "customer") {
            return res.status(403).json({ message: "Only customers can create bookings" });
        }

        // ensure provider exists
        const provider = await User.findOne({ _id: provider_id, role: "provider", is_active: true }).select("_id");
        if (!provider) return res.status(404).json({ message: "Provider not found" });

        // ensure service exists
        const service = await Service.findById(service_id).select("_id service_name category_id");
        if (!service) return res.status(404).json({ message: "Service not found" });

        const booking = await Booking.create({
            customer_id: customerId,
            provider_id,
            service_id,
            date,
            time,
            address,
            notes,
            status: "pending",
            payment_status: "pending",
        });

        return res.status(201).json({ message: "Booking created", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function myBookings(req, res) {
    try {
        const userId = req.user.id;

        const bookings = await Booking.find({ customer_id: userId })
            .sort({ createdAt: -1 })
            .populate("service_id", "service_name description")
            .populate("provider_id", "full_name email phone profile_image")
            .sort({ createdAt: -1 });

        return res.json({ bookings });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function cancelBooking(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const booking = await Booking.findOne({ _id: id, customer_id: userId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.status === "cancelled") {
            return res.json({ message: "Already cancelled" });
        }
        if (booking.status === "completed") {
            return res.status(400).json({ message: "Completed booking cannot be cancelled" });
        }

        booking.status = "cancelled";
        await booking.save();

        return res.json({ message: "Booking cancelled", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}