import mongoose from "mongoose";
import { User } from "../models/Users.js";

export async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.json({ user });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function providerMe(req, res) {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role !== "provider")
            return res.status(403).json({ message: "Only providers allowed" });

        return res.json({ user });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function updateProviderProfile(req, res) {
    try {
        const userId = req.user.id;

        const {
            phone,
            ssn_last4,
            photo_url,
            address_line1,
            address_line2,
            city,
            state,
            zip,
            title,
            bio,
            experience_years,
            service_radius_miles,
            documents,
            categories,
            is_available,
            submit,
        } = req.body;

        const user = await User.findById(userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role !== "provider")
            return res.status(403).json({ message: "Only providers can update profile" });

        user.provider_profile = user.provider_profile || {};

        if (ssn_last4 && !/^\d{4}$/.test(String(ssn_last4))) {
            return res.status(400).json({ message: "ssn_last4 must be exactly 4 digits" });
        }

        if (categories && Array.isArray(categories)) {
            for (const c of categories) {
                if (!mongoose.Types.ObjectId.isValid(c)) {
                    return res.status(400).json({ message: "Invalid category id in categories" });
                }
            }
            user.provider_profile.categories = categories;
        }

        if (documents && Array.isArray(documents)) {
            user.provider_profile.documents = documents
                .filter((d) => d?.type && d?.url)
                .map((d) => ({
                    type: d.type,
                    url: d.url,
                    status: "pending",
                    uploaded_at: new Date(),
                }));
        }

        if (phone !== undefined) user.provider_profile.phone = String(phone).trim();
        if (photo_url !== undefined) user.provider_profile.photo_url = String(photo_url).trim();
        if (address_line1 !== undefined) user.provider_profile.address_line1 = String(address_line1).trim();
        if (address_line2 !== undefined) user.provider_profile.address_line2 = String(address_line2).trim();
        if (city !== undefined) user.provider_profile.city = String(city).trim();
        if (state !== undefined) user.provider_profile.state = String(state).trim();
        if (zip !== undefined) user.provider_profile.zip = String(zip).trim();
        if (title !== undefined) user.provider_profile.title = String(title).trim();
        if (bio !== undefined) user.provider_profile.bio = String(bio).trim();
        if (experience_years !== undefined) user.provider_profile.experience_years = Number(experience_years || 0);
        if (service_radius_miles !== undefined) user.provider_profile.service_radius_miles = Number(service_radius_miles || 10);
        if (ssn_last4 !== undefined) user.provider_profile.ssn_last4 = String(ssn_last4);

        if (is_available !== undefined) user.provider_profile.is_available = Boolean(is_available);

        const missingRequired =
            !user.provider_profile.phone ||
            !user.provider_profile.address_line1 ||
            !user.provider_profile.city ||
            !user.provider_profile.state ||
            !user.provider_profile.zip ||
            !user.provider_profile.ssn_last4;

        user.is_profile_complete = !missingRequired;

        if (submit === true) {
            if (missingRequired) {
                user.provider_status = "draft";
                await user.save();
                return res.status(400).json({
                    message: "Profile incomplete. Fill all required fields before submit.",
                    code: "PROFILE_INCOMPLETE",
                    provider_status: user.provider_status,
                    user,
                });
            }
            user.provider_status = "pending";
        } else {
            user.provider_status = user.is_profile_complete ? (user.provider_status || "pending_verification") : "draft";
        }
        await user.save();
        return res.json({
            message: submit ? "Profile submitted ✅" : "Profile saved ✅",
            user,
        });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export const updateProviderMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            full_name,
            email,
            provider_profile = {},
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (full_name !== undefined) user.full_name = full_name;
        if (email !== undefined) user.email = email;

        if (!user.provider_profile) {
            user.provider_profile = {};
        }

        // only basic editable fields
        if (provider_profile.phone !== undefined) {
            user.provider_profile.phone = provider_profile.phone;
        }
        if (provider_profile.address_line1 !== undefined) {
            user.provider_profile.address_line1 = provider_profile.address_line1;
        }
        if (provider_profile.city !== undefined) {
            user.provider_profile.city = provider_profile.city;
        }
        if (provider_profile.state !== undefined) {
            user.provider_profile.state = provider_profile.state;
        }
        if (provider_profile.zip !== undefined) {
            user.provider_profile.zip = provider_profile.zip;
        }

        await user.save();

        return res.json({
            message: "Profile updated successfully",
            user,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export async function submitProviderOnboarding(req, res) {
    req.body = { ...req.body, submit: true };
    return updateProviderProfile(req, res);
}