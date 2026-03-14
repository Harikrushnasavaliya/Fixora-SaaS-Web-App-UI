import mongoose from "mongoose";
import { Service } from "../models/Services.js";
import { User } from "../models/Users.js";

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

    const provider = await User.findById(providerId).select("_id role is_active");
    if (!provider || provider.role !== "provider") {
      return res.status(403).json({ message: "Only providers can create services" });
    }
    if (provider.is_active === false) {
      return res.status(403).json({ message: "Provider is not active" });
    }

    const doc = await Service.create({
      provider_id: providerId,
      category_id,
      service_name,
      description,
      price: Number(price),
    });

    return res.status(201).json({ message: "Service created", service: doc });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function listServices(req, res) {
  try {
    const services = await Service.find({ is_active: true })
      .sort({ created_at: -1 }) // ✅ you used created_at in schema
      .populate("provider_id", "full_name email phone")
      .populate("category_id", "category_name"); // ✅ correct field

    return res.json({ services });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function myProviderServices(req, res) {
  try {
    const providerId = req.user.id;
    const services = await Service.find({ provider_id: providerId }).sort({ createdAt: -1 });
    return res.json({ services });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}