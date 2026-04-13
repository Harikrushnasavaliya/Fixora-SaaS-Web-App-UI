import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Category } from "../models/Categories.js";

const router = express.Router();

// GET all categories (public)
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create category (admin only)
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { category_name, icon, min_price, max_price, allowed_pricing_types } = req.body;

        if (!category_name?.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }

        if (min_price !== undefined && max_price !== undefined && Number(min_price) > Number(max_price)) {
            return res.status(400).json({ message: "Min price cannot be greater than max price" });
        }

        const existing = await Category.findOne({
            category_name: { $regex: new RegExp(`^${category_name.trim()}$`, "i") },
        });
        if (existing) return res.status(400).json({ message: "Category already exists" });

        const category = await Category.create({
            category_name: category_name.trim(),
            icon: icon?.trim() || "",
            min_price: min_price ?? 0,
            max_price: max_price ?? 9999,
            allowed_pricing_types: allowed_pricing_types || ["hourly", "fixed"],
        });

        res.status(201).json({ message: "Category created", category });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH update category (admin only)
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { category_name, icon, min_price, max_price, allowed_pricing_types } = req.body;

        if (min_price !== undefined && max_price !== undefined && Number(min_price) > Number(max_price)) {
            return res.status(400).json({ message: "Min price cannot be greater than max price" });
        }

        const updates = {};
        if (category_name) updates.category_name = category_name.trim();
        if (icon !== undefined) updates.icon = icon.trim();
        if (min_price !== undefined) updates.min_price = Number(min_price);
        if (max_price !== undefined) updates.max_price = Number(max_price);
        if (allowed_pricing_types) updates.allowed_pricing_types = allowed_pricing_types;

        const category = await Category.findByIdAndUpdate(
            req.params.id, updates, { new: true }
        );
        if (!category) return res.status(404).json({ message: "Category not found" });

        res.json({ message: "Category updated", category });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE category (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH toggle category active/inactive (admin only)
router.patch("/:id/toggle", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        category.is_active = !category.is_active;
        await category.save();
        res.json({
            message: `Category ${category.is_active ? "enabled" : "disabled"}`,
            category,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;