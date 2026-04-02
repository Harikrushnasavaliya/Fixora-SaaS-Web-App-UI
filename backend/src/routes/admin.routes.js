import express from "express";
import { User } from "../models/Users.js";
import { ProviderProfile } from "../models/Provider_profile.js";
import { Service } from "../models/Services.js";

const router = express.Router();

router.get("/providers", async (req, res) => {
    try {
        const { status } = req.query;

        const query = { role: "provider" };
        if (status && status !== "all") query.provider_status = status;

        const providers = await User.find(query).select("-password_hash").lean();

        const withProfiles = await Promise.all(
            providers.map(async (p) => {
                const profile = await ProviderProfile.findOne({ provider_id: p._id }).lean();
                return { ...p, profile };
            })
        );

        res.json({ success: true, providers: withProfiles });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/providers/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!["verified", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: status },
            { new: true }
        ).select("-password_hash");

        if (!user) return res.status(404).json({ success: false, message: "Provider not found" });

        if (status === "verified") {
            await Service.updateMany(
                { provider_id: user._id },
                { $set: { is_active: true } }
            );
        }

        if (status === "rejected") {
            await Service.updateMany(
                { provider_id: user._id },
                { $set: { is_active: false } }
            );
        }

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/providers/:id/approve", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: "verified", is_active: true },
            { new: true }
        ).select("-password_hash");
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch("/providers/:id/reject", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: "rejected", is_active: false },
            { new: true }
        ).select("-password_hash");
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;