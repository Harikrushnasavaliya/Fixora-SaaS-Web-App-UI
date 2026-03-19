import mongoose from "mongoose";
import { User } from "../models/Users.js";

export async function listProviders(req, res) {
    const status = (req.query.status || "").toString();

    const query = { role: "provider" };
    if (status) query.provider_status = status;

    const providers = await User.find(query)
        .select("full_name email role provider_status is_profile_complete provider_profile createdAt")
        .sort({ createdAt: -1 });

    return res.json({ providers });
}

export async function updateProviderStatus(req, res) {
    const { id } = req.params;
    const { provider_status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid provider id" });
    }

    const allowed = ["pending", "verified", "rejected", "draft"];
    if (!allowed.includes(provider_status)) {
        return res.status(400).json({ message: "Invalid provider_status" });
    }

    const user = await User.findOneAndUpdate(
        { _id: id, role: "provider" },
        { provider_status },
        { new: true }
    ).select("full_name email provider_status");

    if (!user) return res.status(404).json({ message: "Provider not found" });

    return res.json({ message: "Updated", provider: user });
}