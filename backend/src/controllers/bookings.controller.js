import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { User } from "../models/Users.js";
import { Service } from "../models/Services.js";
import { sendEmail } from "../utils/mailer.js";

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function toFutureDateTimeOrNull(date, time) {
    const dt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dt.getTime())) return null;
    if (dt.getTime() <= Date.now()) return null;
    return dt;
}

export async function providerRequestReschedule(req, res) {
    try {
        const providerId = req.user.id;
        const { id } = req.params;
        const { date, time, reason } = req.body;

        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid booking id" });
        if (!date || !time) return res.status(400).json({ message: "date and time are required" });

        const dt = toFutureDateTimeOrNull(date, time);
        if (!dt) return res.status(400).json({ message: "Invalid or past date/time" });

        const provider = await User.findById(providerId).select("_id role");
        if (!provider || provider.role !== "provider") return res.status(403).json({ message: "Only providers can reschedule" });

        const booking = await Booking.findOne({ _id: id, provider_id: providerId })
            .populate("customer_id", "full_name email")
            .populate("service_id", "service_name");

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (["cancelled", "completed"].includes(booking.status)) return res.status(400).json({ message: "Booking cannot be rescheduled" });
        if (booking.status === "reschedule_requested") return res.status(400).json({ message: "Reschedule already requested" });

        booking.reschedule = {
            requested: true,
            requested_by: "provider",
            previous_status: booking.status,
            proposed_date: String(date),
            proposed_time: String(time),
            reason: String(reason || ""),
            requested_at: new Date(),
            decided_at: undefined,
            customer_message: "",
        };

        booking.status = "reschedule_requested";
        await booking.save();

        const customer =
            booking.customer_id && typeof booking.customer_id === "object" ? booking.customer_id : null;
        const service =
            booking.service_id && typeof booking.service_id === "object" ? booking.service_id : null;

        if (customer?.email) {
            const subject = "Fixora: Provider requested reschedule";
            const body = `
Hi ${customer.full_name || "Customer"},

Your provider requested to reschedule your booking.

Service: ${service?.service_name || "Service"}
Current: ${booking.date} ${booking.time}
Proposed: ${booking.reschedule.proposed_date} ${booking.reschedule.proposed_time}
Reason: ${booking.reschedule.reason || "-"}

Please open Fixora > My Bookings to approve or reject this reschedule request.

Fixora
`.trim();

            try {
                await sendEmail({ to: customer.email, subject, text: body });
            } catch { }
        }

        return res.json({ message: "Reschedule requested", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function customerRescheduleDecision(req, res) {
    try {
        const customerId = req.user.id;
        const { id } = req.params;
        const { decision, message } = req.body;

        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid booking id" });
        if (!["approve", "reject"].includes(String(decision))) return res.status(400).json({ message: "Invalid decision" });

        const customer = await User.findById(customerId).select("_id role");
        if (!customer || customer.role !== "customer") return res.status(403).json({ message: "Only customers can decide" });

        const booking = await Booking.findOne({ _id: id, customer_id: customerId })
            .populate("provider_id", "full_name email")
            .populate("service_id", "service_name");

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.status !== "reschedule_requested" || !booking.reschedule?.requested) {
            return res.status(400).json({ message: "No reschedule request for this booking" });
        }

        const provider =
            booking.provider_id && typeof booking.provider_id === "object" ? booking.provider_id : null;
        const service =
            booking.service_id && typeof booking.service_id === "object" ? booking.service_id : null;

        booking.reschedule.decided_at = new Date();
        booking.reschedule.customer_message = String(message || "");

        if (decision === "approve") {
            booking.date = booking.reschedule.proposed_date;
            booking.time = booking.reschedule.proposed_time;
            booking.status = "pending";
            booking.reschedule.requested = false;
            booking.reschedule.proposed_date = "";
            booking.reschedule.proposed_time = "";
        } else {
            const prev = booking.reschedule.previous_status || "confirmed";
            booking.status = prev;
            booking.reschedule.requested = false;
            booking.reschedule.proposed_date = "";
            booking.reschedule.proposed_time = "";
        }

        await booking.save();

        if (provider?.email) {
            const subject = `Fixora: Customer ${decision}d reschedule`;
            const body = `
Hi ${provider.full_name || "Provider"},

Customer has ${decision}d your reschedule request.

Service: ${service?.service_name || "Service"}
Booking: ${booking.date} ${booking.time}
Customer message: ${booking.reschedule.customer_message || "-"}

Fixora
`.trim();

            try {
                await sendEmail({ to: provider.email, subject, text: body });
            } catch { }
        }

        return res.json({ message: "Decision saved", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function createBooking(req, res) {
    try {
        const customerId = req.user.id;
        const { provider_id, service_id, date, time, address, notes } = req.body;

        if (!provider_id || !service_id || !date || !time || !address) {
            return res.status(400).json({ message: "Missing fields" });
        }

        if (!isValidObjectId(provider_id) || !isValidObjectId(service_id)) {
            return res.status(400).json({ message: "Invalid provider/service id" });
        }

        if (String(customerId) === String(provider_id)) {
            return res.status(400).json({ message: "You cannot book yourself" });
        }

        const dt = toFutureDateTimeOrNull(date, time);
        if (!dt) {
            return res.status(400).json({ message: "Invalid or past date/time" });
        }

        const customer = await User.findById(customerId).select("_id role");
        if (!customer || customer.role !== "customer") {
            return res.status(403).json({ message: "Only customers can create bookings" });
        }

        const provider = await User.findById(provider_id).select(
            "_id role is_profile_complete provider_status provider_profile",
        );

        if (!provider || provider.role !== "provider") {
            return res.status(404).json({ message: "Provider not found" });
        }

        if (!provider.is_profile_complete) {
            return res.status(400).json({ message: "Provider profile not completed" });
        }

        if (provider.provider_status !== "verified") {
            return res.status(403).json({ message: "Provider not verified" });
        }

        if (!provider.provider_profile?.is_available) {
            return res.status(403).json({ message: "Provider is not available" });
        }

        const service = await Service.findOne({
            _id: service_id,
            provider_id: provider_id,
            is_active: true,
        }).select("_id service_name category_id price");

        if (!service) {
            return res.status(404).json({ message: "Service not found or inactive" });
        }

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

        const user = await User.findById(userId).select("_id role");
        if (!user || user.role !== "customer") {
            return res.status(403).json({ message: "Only customers can view bookings" });
        }

        const bookings = await Booking.find({ customer_id: userId })
            .sort({ createdAt: -1 })
            .populate("service_id", "service_name description price")
            .populate("provider_id", "full_name email provider_profile.photo_url provider_profile.phone");

        return res.json({ bookings });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function cancelBooking(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const user = await User.findById(userId).select("_id role");
        if (!user || user.role !== "customer") {
            return res.status(403).json({ message: "Only customers can cancel bookings" });
        }

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findOne({ _id: id, customer_id: userId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.status === "cancelled") {
            return res.json({ message: "Already cancelled", booking });
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

export async function providerRequests(req, res) {
    try {
        const providerId = req.user.id;

        const user = await User.findById(providerId).select("_id role provider_status is_profile_complete");
        if (!user || user.role !== "provider") {
            return res.status(403).json({ message: "Only providers can view requests" });
        }

        const status = String(req.query.status || "pending");

        const allowed = ["pending", "accepted", "rejected", "cancelled", "completed", "all"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status filter" });
        }

        const query = { provider_id: providerId };
        if (status !== "all") query.status = status;

        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .populate("service_id", "service_name description price")
            .populate("customer_id", "full_name email");

        return res.json({ bookings });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function acceptBooking(req, res) {
    try {
        const providerId = req.user.id;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findOne({ _id: id, provider_id: providerId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.status !== "pending") {
            return res.status(400).json({ message: `Cannot accept booking in status: ${booking.status}` });
        }

        booking.status = "accepted";
        await booking.save();

        return res.json({ message: "Booking accepted", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function rejectBooking(req, res) {
    try {
        const providerId = req.user.id;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findOne({ _id: id, provider_id: providerId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.status !== "pending") {
            return res.status(400).json({ message: `Cannot reject booking in status: ${booking.status}` });
        }

        booking.status = "rejected";
        await booking.save();

        return res.json({ message: "Booking rejected", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function providerBookings(req, res) {
    try {
        const providerId = req.user.id;

        const provider = await User.findById(providerId).select("_id role");
        if (!provider || provider.role !== "provider") {
            return res.status(403).json({ message: "Only providers can view bookings" });
        }

        const bookings = await Booking.find({ provider_id: providerId })
            .sort({ createdAt: -1 })
            .populate("customer_id", "full_name email")
            .populate("service_id", "service_name price");

        return res.json({ bookings });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function providerUpdateBookingStatus(req, res) {
    try {
        const providerId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        if (!["confirmed", "rejected", "completed", "cancelled"].includes(String(status))) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const provider = await User.findById(providerId).select("_id role");
        if (!provider || provider.role !== "provider") {
            return res.status(403).json({ message: "Only providers can update booking status" });
        }

        const booking = await Booking.findOne({ _id: id, provider_id: providerId })
            .populate("customer_id", "full_name email")
            .populate("service_id", "service_name price");

        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.status === "completed" || booking.status === "cancelled") {
            return res.status(400).json({ message: "Booking cannot be updated" });
        }

        if (booking.status !== "pending" && (status === "confirmed" || status === "rejected")) {
            return res.status(400).json({ message: "Only pending bookings can be confirmed/rejected" });
        }

        booking.status = status;
        await booking.save();

        const customer =
            booking.customer_id && typeof booking.customer_id === "object" ? booking.customer_id : null;
        const service =
            booking.service_id && typeof booking.service_id === "object" ? booking.service_id : null;

        if (customer?.email) {
            const subject =
                status === "confirmed"
                    ? "Fixora: Booking Confirmed"
                    : status === "rejected"
                        ? "Fixora: Booking Rejected"
                        : status === "completed"
                            ? "Fixora: Job Completed"
                            : "Fixora: Booking Updated";

            const body = `
Hi ${customer.full_name || "Customer"},

Your booking status is now: ${status}

Service: ${service?.service_name || "Service"}
Date: ${booking.date || "-"}
Time: ${booking.time || "-"}
Address: ${booking.address || "-"}

Thank you,
Fixora
`.trim();

            try {
                await sendEmail({ to: customer.email, subject, text: body });
            } catch { }
        }

        return res.json({ message: "Booking updated", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function rescheduleBooking(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { date, time } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        if (!date || !time) {
            return res.status(400).json({ message: "date and time are required" });
        }

        const dt = new Date(`${date}T${time}:00`);
        if (Number.isNaN(dt.getTime()) || dt.getTime() <= Date.now()) {
            return res.status(400).json({ message: "Invalid or past date/time" });
        }

        const booking = await Booking.findOne({ _id: id, customer_id: userId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Cancelled booking cannot be rescheduled" });
        }
        if (booking.status === "completed") {
            return res.status(400).json({ message: "Completed booking cannot be rescheduled" });
        }

        booking.date = date;
        booking.time = time;
        booking.status = "pending";
        await booking.save();

        return res.json({ message: "Booking rescheduled", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}