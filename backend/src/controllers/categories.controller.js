import { Category } from "../models/Categories.js";

export async function getCategories(req, res) {
  const items = await Category.find().sort({ category_name: 1 });
  res.json(items);
}