import mongoose from "mongoose";
import { User } from "../models/Users.js";
import { ProviderService } from "../models/Provide_services.js";
import { Location } from "../models/Locations.js";
import { Service } from "../models/Services.js";
import { ProviderProfile } from "../models/Provider_profile.js";

export async function searchProviders(req, res) {
    try {
        const {
            service_id,
            category_id,
            minPrice,
            maxPrice,
            minRating,
            maxDistance = 10,
            lat,
            lng,
            q,
        } = req.query;

        // 1) Determine candidate service ids
        let serviceIds = [];
        if (service_id) {
            serviceIds = [service_id];
        } else if (category_id) {
            const services = await Service.find({ category_id }).select("_id");
            serviceIds = services.map((s) => String(s._id));
        }

        // 2) ProviderService filter (service + price)
        const psFilter = {};
        if (serviceIds.length > 0) {
            psFilter.service_id = {
                $in: serviceIds.map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
        if (minPrice || maxPrice) {
            psFilter.price_per_hour = {};
            if (minPrice) psFilter.price_per_hour.$gte = Number(minPrice);
            if (maxPrice) psFilter.price_per_hour.$lte = Number(maxPrice);
        }

        const providerServiceRows = await ProviderService.find(psFilter).lean();
        const providerIdsFromService = [
            ...new Set(providerServiceRows.map((r) => String(r.provider_id))),
        ];

        // 3) Provider profile filter (rating)
        const profileFilter = {};
        if (minRating) profileFilter.rating_avg = { $gte: Number(minRating) };

        const profiles = await ProviderProfile.find(profileFilter).lean();
        const providerIdsFromProfile = [
            ...new Set(profiles.map((p) => String(p.provider_id))),
        ];

        // intersect if both filters used
        let candidateProviderIds = providerIdsFromProfile;
        if (providerIdsFromService.length > 0) {
            candidateProviderIds = candidateProviderIds.filter((id) =>
                providerIdsFromService.includes(id)
            );
        }

        // If no candidates (e.g., no filters), allow all providers
        let finalProviderIds = candidateProviderIds;
        if (
            finalProviderIds.length === 0 &&
            (!service_id && !category_id && !minRating && !minPrice && !maxPrice)
        ) {
            const allProviders = await User.find({
                role: "provider",
                is_active: true,
            }).select("_id");
            finalProviderIds = allProviders.map((u) => String(u._id));
        }

        // 4) Geo filter using Locations
        let nearbyProviderIds = finalProviderIds;
        if (lat && lng && finalProviderIds.length > 0) {
            const maxMeters = Number(maxDistance) * 1000;

            const nearbyLocations = await Location.find({
                user_id: {
                    $in: finalProviderIds.map((id) => new mongoose.Types.ObjectId(id)),
                },
                geo: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [Number(lng), Number(lat)],
                        },
                        $maxDistance: maxMeters,
                    },
                },
            })
                .select("user_id geo")
                .lean();

            nearbyProviderIds = nearbyLocations.map((l) => String(l.user_id));
        }

        // 5) Optional name search (q)
        const userFilter = {
            _id: {
                $in: nearbyProviderIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            role: "provider",
            is_active: true,
        };
        if (q) userFilter.full_name = { $regex: q, $options: "i" };

        const users = await User.find(userFilter)
            .select("full_name email phone profile_image")
            .lean();

        // 6) Attach profile + prices for UI
        const profileMap = new Map(
            profiles.map((p) => [String(p.provider_id), p])
        );

        const pricesByProvider = providerServiceRows.reduce((acc, r) => {
            const pid = String(r.provider_id);
            acc[pid] = acc[pid] || [];
            acc[pid].push({ service_id: r.service_id, price_per_hour: r.price_per_hour });
            return acc;
        }, {});

        const result = users.map((u) => ({
            id: u._id,
            full_name: u.full_name,
            profile_image: u.profile_image,
            ...(profileMap.get(String(u._id)) || {}),
            services: pricesByProvider[String(u._id)] || [],
        }));

        return res.json(result);
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

export async function getProviderById(req, res) {
    try {
        const providerId = req.params.id;

        const user = await User.findOne({ _id: providerId, role: "provider" })
            .select("full_name email phone profile_image")
            .lean();

        if (!user) return res.status(404).json({ message: "Provider not found" });

        const profile = await ProviderProfile.findOne({ provider_id: providerId }).lean();
        const services = await ProviderService.find({ provider_id: providerId })
            .populate("service_id")
            .lean();

        return res.json({ user, profile, services });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}