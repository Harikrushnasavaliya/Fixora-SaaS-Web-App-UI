import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Category } from "../models/Categories.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { category_name, icon } = req.body;
        if (!category_name?.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }
        const existing = await Category.findOne({
            category_name: { $regex: new RegExp(`^${category_name.trim()}$`, "i") },
        });
        if (existing) {
            return res.status(400).json({ message: "Category already exists" });
        }
        const category = await Category.create({
            category_name: category_name.trim(),
            icon: icon?.trim() || "",
        });
        res.status(201).json({ message: "Category created", category });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const { category_name, icon } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { category_name: category_name?.trim(), icon: icon?.trim() },
            { new: true }
        );
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category updated", category });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;