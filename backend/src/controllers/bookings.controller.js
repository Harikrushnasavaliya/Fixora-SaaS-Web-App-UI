import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { User } from "../models/Users.js";
import { Service } from "../models/Services.js";
import { sendEmail } from "../utils/mailer.js";
import { ServiceIssue } from "../models/ServiceIssue.js";

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function toFutureDateTimeOrNull(date, time) {
    const dt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dt.getTime())) return null;
    if (dt.getTime() <= Date.now()) return null;
    return dt;
}

export const requestReschedule = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const userId = String(req.user.id);
        const role = req.user.role;

        const customerId =
            typeof booking.customer_id === "object" && booking.customer_id?._id
                ? String(booking.customer_id._id)
                : String(booking.customer_id);

        const providerId =
            typeof booking.provider_id === "object" && booking.provider_id?._id
                ? String(booking.provider_id._id)
                : String(booking.provider_id);

        const isCustomerOwner = role === "customer" && customerId === userId;
        const isProviderOwner = role === "provider" && providerId === userId;

        if (!isCustomerOwner && !isProviderOwner) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { date, time, reason } = req.body;

        if (!date || !time) {
            return res.status(400).json({ message: "Date and time are required" });
        }

        booking.reschedule = {
            requested: true,
            proposed_date: date,
            proposed_time: time,
            reason: reason || "",
            requested_by: role,
            previous_status: booking.status,
            decision: "pending",
        };

        booking.status = "reschedule_requested";

        await booking.save();

        return res.json({
            message: "Reschedule request submitted successfully",
            booking,
        });
    } catch (error) {
        console.error("requestReschedule error:", error);
        return res.status(500).json({ message: "Failed to reschedule booking" });
    }
};

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
            } catch (err) {
                return res.status(500).json({ message: err.message });
            }
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
            total_amount: service.price,
            currency: "USD",
        });

        return res.status(201).json({ message: "Booking created", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function myBookings(req, res) {
    try {
        const userId = req.user.id;
        const { tab, page, search = "" } = req.query;

        const user = await User.findById(userId).select("_id role");
        if (!user || user.role !== "customer") {
            return res.status(403).json({ message: "Only customers can view bookings" });
        }

        // No tab/page = return all (for overview section stats)
        if (!tab && !page) {
            const bookings = await Booking.find({ customer_id: userId })
                .sort({ createdAt: -1 })
                .populate("service_id", "service_name description price")
                .populate("provider_id", "full_name email phone provider_profile");
            return res.json({ bookings });
        }

        const PAGE_SIZE = 5;
        const skip = (Number(page || 1) - 1) * PAGE_SIZE;
        const activeStatuses = ["pending", "confirmed", "work_completed", "reschedule_requested"];
        const pastStatuses = ["completed", "cancelled"];

        const baseQuery = {
            customer_id: new mongoose.Types.ObjectId(String(userId)),
            status: { $in: tab === "active" ? activeStatuses : pastStatuses }
        };

        if (tab === "resolved" || tab === "past") {
            const resolvedIssues = await ServiceIssue.find({
                customer_id: userId, status: "resolved"
            }).select("booking_id").lean();
            const resolvedIds = resolvedIssues.map(i => new mongoose.Types.ObjectId(String(i.booking_id)));
            if (tab === "resolved") {
                baseQuery._id = { $in: resolvedIds };
            } else if (resolvedIds.length > 0) {
                baseQuery._id = { $nin: resolvedIds };
            }
        }

        const pipeline = [
            { $match: baseQuery },
            { $lookup: { from: "users", localField: "provider_id", foreignField: "_id", as: "provider_id", pipeline: [{ $project: { full_name: 1, email: 1, phone: 1, provider_profile: 1 } }] } },
            { $unwind: { path: "$provider_id", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$service_id", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true } },
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "provider_id.full_name": { $regex: search, $options: "i" } },
                        { "service_id.service_name": { $regex: search, $options: "i" } },
                        { date: { $regex: search, $options: "i" } },
                        { address: { $regex: search, $options: "i" } },
                    ]
                }
            });
        }

        const countResult = await Booking.aggregate([...pipeline, { $count: "total" }]);
        const total = countResult[0]?.total || 0;
        pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: PAGE_SIZE });
        const bookings = await Booking.aggregate(pipeline);

        return res.json({ bookings, total, page: Number(page || 1), totalPages: Math.ceil(total / PAGE_SIZE) });
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
        const { page, search = "", status = "" } = req.query;

        const provider = await User.findById(providerId).select("_id role");
        if (!provider || provider.role !== "provider") {
            return res.status(403).json({ message: "Only providers can view bookings" });
        }

        const baseQuery = { provider_id: new mongoose.Types.ObjectId(String(providerId)) };
        if (status) baseQuery.status = status;

        // No page = return all (for dashboard stats)
        if (!page && !search) {
            const bookings = await Booking.find(baseQuery)
                .sort({ createdAt: -1 })
                .populate("customer_id", "full_name email")
                .populate("service_id", "service_name price");
            return res.json({ bookings });
        }

        const PAGE_SIZE = 5;
        const skip = (Number(page || 1) - 1) * PAGE_SIZE;

        const pipeline = [
            { $match: baseQuery },
            { $lookup: { from: "users", localField: "customer_id", foreignField: "_id", as: "customer_id", pipeline: [{ $project: { full_name: 1, email: 1 } }] } },
            { $unwind: { path: "$customer_id", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "services", localField: "service_id", foreignField: "_id", as: "service_id", pipeline: [{ $project: { service_name: 1, price: 1 } }] } },
            { $unwind: { path: "$service_id", preserveNullAndEmptyArrays: true } },
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "customer_id.full_name": { $regex: search, $options: "i" } },
                        { "customer_id.email": { $regex: search, $options: "i" } },
                        { "service_id.service_name": { $regex: search, $options: "i" } },
                        { date: { $regex: search, $options: "i" } },
                    ]
                }
            });
        }

        const countResult = await Booking.aggregate([...pipeline, { $count: "total" }]);
        const total = countResult[0]?.total || 0;
        pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: PAGE_SIZE });
        const bookings = await Booking.aggregate(pipeline);

        return res.json({ bookings, total, page: Number(page || 1), totalPages: Math.ceil(total / PAGE_SIZE) });
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
            const body = ` Hi ${customer.full_name || "Customer"},

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
            } catch (err) {
                return res.status(500).json({ message: err.message });
            }
        }

        return res.json({ message: "Booking updated", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function getBookingById(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findById(id)
            .populate("provider_id", "full_name email provider_profile")
            .populate("service_id", "service_name price")
            .populate("customer_id", "full_name email");

        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // ✅ Only customer or provider of this booking can view
        const customerId = booking.customer_id?._id?.toString() || booking.customer_id?.toString();
        const providerId = booking.provider_id?._id?.toString() || booking.provider_id?.toString();

        if (customerId !== userId && providerId !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        return res.json({ booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function providerCompleteBooking(req, res) {
    try {
        const providerId = req.user.id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const provider = await User.findById(providerId).select("_id role");
        if (!provider || provider.role !== "provider") {
            return res.status(403).json({ message: "Only providers can complete bookings" });
        }

        const booking = await Booking.findOne({ _id: id, provider_id: providerId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.status !== "confirmed") {
            return res.status(400).json({ message: "Only confirmed bookings can be completed" });
        }

        booking.status = "work_completed";
        await booking.save();

        return res.json({ message: "Booking marked as completed", booking });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export const approveReschedule = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const userId = String(req.user.id);
        const role = req.user.role;

        const customerId =
            typeof booking.customer_id === "object" && booking.customer_id?._id
                ? String(booking.customer_id._id)
                : String(booking.customer_id);

        const providerId =
            typeof booking.provider_id === "object" && booking.provider_id?._id
                ? String(booking.provider_id._id)
                : String(booking.provider_id);

        if (
            (role === "customer" && customerId !== userId) ||
            (role === "provider" && providerId !== userId)
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (!booking.reschedule?.requested) {
            return res.status(400).json({ message: "No reschedule request found" });
        }

        const requestedBy = booking.reschedule.requested_by;

        if (requestedBy === role) {
            return res.status(403).json({
                message: "You cannot approve your own reschedule request",
            });
        }

        booking.date = booking.reschedule.proposed_date || booking.date;
        booking.time = booking.reschedule.proposed_time || booking.time;
        booking.status = "confirmed";

        booking.reschedule = {
            requested: false,
            proposed_date: null,
            proposed_time: null,
            reason: "",
            requested_by: null,
            previous_status: null,
            decision: "accepted",
        };

        await booking.save();

        return res.json({
            message: "Reschedule approved successfully",
            booking,
        });
    } catch (error) {
        console.error("approveReschedule error:", error);
        return res.status(500).json({ message: "Failed to approve reschedule" });
    }
};

export async function rejectReschedule(req, res) {
    try {
        const userId = String(req.user.id);
        const role = req.user.role;

        const { rejection_reason, rejection_message } = req.body || {};

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Only CUSTOMER can reject provider reschedule
        const customerId =
            typeof booking.customer_id === "object" && booking.customer_id
                ? String(booking.customer_id._id)
                : String(booking.customer_id);

        if (role !== "customer" || customerId !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Must have pending reschedule request
        if (!booking.reschedule?.requested) {
            return res.status(400).json({ message: "No reschedule request found" });
        }

        if (booking.reschedule.requested_by !== "provider") {
            return res.status(400).json({ message: "This request is not from provider" });
        }

        // Keep original booking active
        const prev = booking.reschedule.previous_status || booking.status;
        booking.reschedule = {
            ...booking.reschedule,
            decision: "rejected",
            rejection_reason,
            rejection_message,
            decided_at: new Date(),
            requested: false,
        };

        booking.status = prev;

        await booking.save();
        return res.json({
            message: "Reschedule rejected. Original booking remains active.",
            booking,
        });
    } catch (err) {
        console.error("rejectReschedule error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function providerCompleteWork(req, res) {
    try {
        const providerId = req.user.id;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findOne({ _id: id, provider_id: providerId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // only confirmed bookings can be completed
        if (booking.status !== "confirmed") {
            return res.status(400).json({ message: "Only confirmed bookings can be completed" });
        }

        booking.status = "work_completed";
        await booking.save();

        return res.json({ message: "Work marked as completed. Customer can pay now.", booking });
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