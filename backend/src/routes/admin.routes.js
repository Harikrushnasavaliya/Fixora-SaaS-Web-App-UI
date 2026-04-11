import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { User } from "../models/Users.js";
import { Service } from "../models/Services.js";

const router = express.Router();

// ── GET all providers by status ──
router.get("/providers", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { status } = req.query;
        const query = { role: "provider" };

        if (status && status !== "all") {
            // handle both "pending" and "pending_verification"
            if (status === "pending") {
                query.provider_status = { $in: ["pending", "pending_verification"] };
            } else {
                query.provider_status = status;
            }
        }

        const providers = await User.find(query).select("-password_hash").lean();
        res.json({ success: true, providers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH update provider status ──
router.patch("/providers/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { status } = req.body;

        if (!["verified", "rejected", "pending", "pending_verification", "draft"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: status },
            { new: true }
        ).select("-password_hash");

        if (!user) return res.status(404).json({ success: false, message: "Provider not found" });

        if (status === "verified") {
            await Service.updateMany({ provider_id: user._id }, { $set: { is_active: true } });
        }

        if (status === "rejected") {
            await Service.updateMany({ provider_id: user._id }, { $set: { is_active: false } });
        }

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH approve provider ──
router.patch("/providers/:id/approve", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: "verified", is_active: true },
            { new: true }
        ).select("-password_hash");
        if (!user) return res.status(404).json({ success: false, message: "Provider not found" });
        await Service.updateMany({ provider_id: user._id }, { $set: { is_active: true } });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH reject provider ──
router.patch("/providers/:id/reject", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: "rejected", is_active: false },
            { new: true }
        ).select("-password_hash");
        if (!user) return res.status(404).json({ success: false, message: "Provider not found" });
        await Service.updateMany({ provider_id: user._id }, { $set: { is_active: false } });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET deactivated users ──
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { is_active } = req.query;
        const query = {};
        if (is_active === "false") query.is_active = false;
        const users = await User.find(query).select(
            "_id full_name email role is_active deactivated_at"
        );
        res.json({ users });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ── PATCH reactivate user ──
router.patch("/users/:id/reactivate", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { is_active: true, deactivated_at: null },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "Account reactivated successfully", user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// GET all services (admin view)
router.get("/services", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const services = await Service.find()
            .populate({ path: "provider_id", select: "full_name email" })
            .populate({ path: "category_id", select: "category_name" })
            .sort({ createdAt: -1 });
        res.json({ services });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH enable/disable service (admin)
router.patch("/services/:id/toggle", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service not found" });

        service.is_active = !service.is_active;
        await service.save();

        res.json({
            message: `Service ${service.is_active ? "enabled" : "disabled"} successfully`,
            service,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;