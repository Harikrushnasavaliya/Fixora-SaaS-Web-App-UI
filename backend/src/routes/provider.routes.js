import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { providerMe, updateProviderProfile } from "../controllers/provider.controller.js";

const router = express.Router();

router.get("/me", requireAuth, requireRole("provider"), providerMe);
router.put("/profile", requireAuth, requireRole("provider"), updateProviderProfile);

export default router;