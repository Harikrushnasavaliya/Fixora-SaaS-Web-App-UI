import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getMetrics } from "../controllers/admin.controller.js";

const router = Router();

router.get("/metrics", requireAuth, requireRole("admin"), getMetrics);

export default router;