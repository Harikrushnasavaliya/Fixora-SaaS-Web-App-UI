import mongoose from "mongoose";
import { Service } from "../models/Services.js";
import { User } from "../models/Users.js";
import { Category } from "../models/Categories.js";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
export async function createService(req, res) {
  try {
    const providerId = req.user.id;
    const { category_id, service_name, description, price, pricing_type } = req.body;

    if (!category_id || !service_name || price === undefined || !pricing_type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const finalPricingType = pricing_type || "fixed";

    if (!["hourly", "fixed"].includes(finalPricingType)) {
      return res.status(400).json({ message: "pricing_type must be hourly or fixed" });
    }

    if (!["hourly", "fixed"].includes(pricing_type)) {
      return res.status(400).json({ message: "pricing_type must be hourly or fixed" });
    }

    if (!mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({ message: "Invalid category_id" });
    }

    const category = await Category.findById(category_id);
    if (!category) return res.status(400).json({ message: "Category not found" });

    // ✅ Validate pricing type allowed
    if (!category.allowed_pricing_types.includes(pricing_type)) {
      return res.status(400).json({
        message: `This category only allows: ${category.allowed_pricing_types.join(", ")} pricing`
      });
    }

    // ✅ Validate price range
    if (price < category.min_price) {
      return res.status(400).json({
        message: `Minimum price for this category is $${category.min_price}`
      });
    }
    if (price > category.max_price) {
      return res.status(400).json({
        message: `Maximum price for this category is $${category.max_price}`
      });
    }

    const provider = await User.findById(providerId).select(
      "_id role is_active is_profile_complete provider_status provider_profile"
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
      });
    }

    if (provider.provider_profile?.is_available === false) {
      return res.status(403).json({
        message: "Provider is not available",
        code: "PROVIDER_NOT_AVAILABLE",
      });
    }

    const isVerified = provider.provider_status === "verified";

    const doc = await Service.create({
      provider_id: providerId,
      category_id,
      service_name,
      description,
      pricing_type,
      price: Number(price),
      is_active: isVerified,
    });

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
    const { page, search = "" } = req.query;
    const PAGE_SIZE = 5;

    const query = { provider_id: providerId };
    if (search) query.service_name = { $regex: search, $options: "i" };

    if (!page) {
      const services = await Service.find(query)
        .sort({ createdAt: -1 })
        .populate({ path: "category_id", select: "category_name icon" });
      return res.json({ services });
    }

    const skip = (Number(page) - 1) * PAGE_SIZE;
    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate({ path: "category_id", select: "category_name icon" });

    return res.json({ services, total, page: Number(page), totalPages: Math.ceil(total / PAGE_SIZE) });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function updateMyService(req, res) {
  try {
    const providerId = req.user.id;
    const { id } = req.params;
    const { service_name, description, price, category_id } = req.body;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid service id" });

    const svc = await Service.findOne({ _id: id, provider_id: providerId });
    if (!svc) return res.status(404).json({ message: "Service not found" });

    if (category_id) {
      if (!isValidId(category_id)) return res.status(400).json({ message: "Invalid category_id" });
      const cat = await Category.findById(category_id).select("_id");
      if (!cat) return res.status(400).json({ message: "Category not found" });
      svc.category_id = category_id;
    }

    if (service_name !== undefined) svc.service_name = String(service_name).trim();
    if (description !== undefined) svc.description = String(description).trim();
    if (price !== undefined) svc.price = Number(price);

    await svc.save();
    return res.json({ message: "Service updated", service: svc });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function toggleMyService(req, res) {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid service id" });

    const svc = await Service.findOne({ _id: id, provider_id: providerId });
    if (!svc) return res.status(404).json({ message: "Service not found" });

    svc.is_active = !svc.is_active;
    await svc.save();

    return res.json({ message: "Service status updated", service: svc });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function deleteMyService(req, res) {
  try {
    const providerId = req.user.id;
    const { id } = req.params;

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid service id" });

    const svc = await Service.findOneAndDelete({ _id: id, provider_id: providerId });
    if (!svc) return res.status(404).json({ message: "Service not found" });

    return res.json({ message: "Service deleted" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}