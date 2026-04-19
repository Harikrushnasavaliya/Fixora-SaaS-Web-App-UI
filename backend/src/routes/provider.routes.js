import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { providerMe, updateProviderProfile, updateProviderMe } from "../controllers/provider.controller.js";

const router = express.Router();

router.put("/profile", requireAuth, requireRole("provider", "admin"), updateProviderProfile);
router.get("/me", requireAuth, requireRole("provider", "admin"), providerMe);
router.patch("/me", requireAuth, requireRole("provider", "admin"), updateProviderMe);

export default router;