import { Service } from "../models/Services.js";

export async function getServices(req, res) {
  const { category_id } = req.query;

  const filter = {};
  if (category_id) filter.category_id = category_id;

  const items = await Service.find(filter).sort({ service_name: 1 });
  res.json(items);
}