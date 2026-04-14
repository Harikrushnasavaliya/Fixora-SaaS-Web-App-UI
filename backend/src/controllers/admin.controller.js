import { User } from "../models/Users.js";
import { Service } from "../models/Services.js";

const PAGE_SIZE = 5;

// GET /api/admin/providers
export async function listProviders(req, res) {
    try {
        const { status, page = 1, search = "" } = req.query;
        const query = { role: "provider" };

        if (status && status !== "all") {
            if (status === "pending") {
                query.provider_status = { $in: ["pending", "pending_verification"] };
            } else {
                query.provider_status = status;
            }
        }

        if (search) {
            query.$or = [
                { full_name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { "provider_profile.phone": { $regex: search, $options: "i" } },
            ];
        }

        const skip = (Number(page) - 1) * PAGE_SIZE;
        const total = await User.countDocuments(query);
        const providers = await User.find(query)
            .select("-password_hash")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(PAGE_SIZE)
            .lean();

        return res.json({
            success: true,
            providers,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// PATCH /api/admin/providers/:id/status
export async function updateProviderStatus(req, res) {
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
}

// PATCH /api/admin/providers/:id/approve
export async function approveProvider(req, res) {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: "verified", is_active: true },
            { new: true }
        ).select("-password_hash");

        if (!user) return res.status(404).json({ success: false, message: "Provider not found" });
        await Service.updateMany({ provider_id: user._id }, { $set: { is_active: true } });
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// PATCH /api/admin/providers/:id/reject
export async function rejectProvider(req, res) {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { provider_status: "rejected", is_active: false },
            { new: true }
        ).select("-password_hash");

        if (!user) return res.status(404).json({ success: false, message: "Provider not found" });
        await Service.updateMany({ provider_id: user._id }, { $set: { is_active: false } });
        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// GET /api/admin/users
export async function listUsers(req, res) {
    try {
        const { is_active, page = 1, search = "" } = req.query;
        const query = {};

        if (is_active === "false") query.is_active = false;

        if (search) {
            query.$or = [
                { full_name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (Number(page) - 1) * PAGE_SIZE;
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select("_id full_name email role is_active deactivated_at")
            .sort({ deactivated_at: -1 })
            .skip(skip)
            .limit(PAGE_SIZE);

        return res.json({
            users,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
}

// PATCH /api/admin/users/:id/reactivate
export async function reactivateUser(req, res) {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { is_active: true, deactivated_at: null },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.json({ message: "Account reactivated successfully", user });
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
}

// GET /api/admin/services
export async function listServices(req, res) {
    try {
        const { page = 1, search = "" } = req.query;
        const query = {};

        if (search) {
            query.service_name = { $regex: search, $options: "i" };
        }

        const skip = (Number(page) - 1) * PAGE_SIZE;
        const total = await Service.countDocuments(query);
        const services = await Service.find(query)
            .populate({ path: "provider_id", select: "full_name email provider_profile" })
            .populate({ path: "category_id", select: "category_name" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(PAGE_SIZE);

        return res.json({
            services,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / PAGE_SIZE),
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// PATCH /api/admin/services/:id/toggle
export async function toggleService(req, res) {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Service not found" });

        service.is_active = !service.is_active;
        await service.save();

        return res.json({
            message: `Service ${service.is_active ? "enabled" : "disabled"} successfully`,
            service,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}