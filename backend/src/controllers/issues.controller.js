import { ServiceIssue } from "../models/ServiceIssue.js";
import { Booking } from "../models/Booking.js";

// POST - Customer reports issue
export async function createIssue(req, res) {
    try {
        const customer_id = req.user.id;
        const { booking_id, issue_type, description } = req.body;

        if (!booking_id || !issue_type || !description) {
            return res.status(400).json({ message: "booking_id, issue_type and description are required" });
        }

        const booking = await Booking.findById(booking_id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.customer_id.toString() !== customer_id) {
            return res.status(403).json({ message: "Not your booking" });
        }

        // Check if issue already reported for this booking
        const existing = await ServiceIssue.findOne({ booking_id });
        if (existing) {
            return res.status(400).json({ message: "Issue already reported for this booking" });
        }

        const issue = await ServiceIssue.create({
            booking_id,
            customer_id,
            provider_id: booking.provider_id,
            service_id: booking.service_id,
            issue_type,
            description: description.trim(),
        });

        return res.status(201).json({ message: "Issue reported successfully", issue });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// GET - All issues (admin)
export async function getAllIssues(req, res) {
    try {
        const issues = await ServiceIssue.find()
            .populate({ path: "customer_id", select: "full_name email" })
            .populate({ path: "provider_id", select: "full_name email" })
            .populate({ path: "service_id", select: "service_name" })
            .populate({ path: "booking_id", select: "date time" })
            .sort({ createdAt: -1 });
        return res.json({ issues });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// GET - Provider's own issues
export async function providerIssues(req, res) {
    try {
        const issues = await ServiceIssue.find({ provider_id: req.user.id })
            .populate({ path: "customer_id", select: "full_name email" })
            .populate({ path: "service_id", select: "service_name" })
            .populate({ path: "booking_id", select: "date time" })
            .sort({ createdAt: -1 });
        return res.json({ issues });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// PATCH - Admin updates issue status
export async function updateIssueStatus(req, res) {
    try {
        const { status, admin_notes } = req.body;
        const issue = await ServiceIssue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });

        if (status) issue.status = status;
        if (admin_notes !== undefined) issue.admin_notes = admin_notes;
        await issue.save();

        return res.json({ message: "Issue updated", issue });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// GET - Customer's own issues
export async function myIssues(req, res) {
    try {
        const issues = await ServiceIssue.find({ customer_id: req.user.id })
            .populate({ path: "service_id", select: "service_name" })
            .populate({ path: "booking_id", select: "date time" })
            .sort({ createdAt: -1 });
        return res.json({ issues });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

export async function providerRespondToIssue(req, res) {
    try {
        const { response } = req.body;
        if (!response?.trim()) {
            return res.status(400).json({ message: "Response is required" });
        }

        const issue = await ServiceIssue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });

        if (issue.provider_id.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not your issue" });
        }

        issue.provider_response = response.trim();
        issue.provider_responded_at = new Date();
        issue.status = "in_review";
        await issue.save();

        return res.json({ message: "Response submitted", issue });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}