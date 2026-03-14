import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createService, listServices, myProviderServices } from "../controllers/services.controller.js";

const router = Router();

// public listing (customer can view)
router.get("/", listServices);

// provider creates service
router.post("/", requireAuth, requireRole("provider"), createService);

// provider views their services
router.get("/my", requireAuth, requireRole("provider"), myProviderServices);

export default router;