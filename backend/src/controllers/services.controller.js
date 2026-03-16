import mongoose from "mongoose";
import { Service } from "../models/Services.js";
import { User } from "../models/Users.js";
import { Category } from "../models/Categories.js";

export async function createService(req, res) {
  try {
    const providerId = req.user.id;
    const { category_id, service_name, description, price } = req.body;

    if (!category_id || !service_name || price === undefined) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({ message: "Invalid category_id" });
    }

    const category = await Category.findById(category_id).select("_id");
    if (!category) return res.status(400).json({ message: "Category not found" });

    const provider = await User.findById(providerId).select(
      "_id role is_active is_profile_complete provider_status provider_profile",
    );

    if (!provider || provider.role !== "provider") {
      return res.status(403).json({ message: "Only providers can create services" });
    }

    if (provider.is_active === false) {
      return res.status(403).json({ message: "Provider is not active" });
    }

    if (!provider.is_profile_complete) {
      return res.status(400).json({
        message: "Provider profile not completed",
        code: "PROFILE_INCOMPLETE",
        provider_status: provider.provider_status || "draft",
      });
    }

    const isVerified = provider.provider_status === "verified";
    const doc = await Service.create({
      provider_id: providerId,
      category_id,
      service_name,
      description,
      price: Number(price),
      is_active: isVerified,
    });

    if (!provider.provider_profile?.is_available) {
      return res.status(403).json({
        message: "Provider is not available",
        code: "PROVIDER_NOT_AVAILABLE",
      });
    }

    return res.status(201).json({ message: "Service created", service: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function listServices(req, res) {
  try {
    const services = await Service.find({ is_active: true })
      .populate({
        path: "provider_id",
        match: {
          provider_status: "verified",
          is_profile_complete: true,
          is_active: true,
          "provider_profile.is_available": true,
        },
        select: "full_name provider_profile provider_status is_profile_complete",
      })
      .populate({
        path: "category_id",
        select: "category_name icon",
      })
      .lean();

    const visible = services.filter((s) => s.provider_id);

    return res.json({ services: visible });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function myProviderServices(req, res) {
  try {
    const providerId = req.user.id;
    const services = await Service.find({ provider_id: providerId })
      .sort({ createdAt: -1 })
      .populate({ path: "category_id", select: "category_name icon" });

    return res.json({ services });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}