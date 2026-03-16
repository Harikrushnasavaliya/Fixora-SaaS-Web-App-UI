import express from "express";
import { createService, myProviderServices, listServices } from "../controllers/services.controller.js";
import { requireAuth, requireRole, requireProviderProfileComplete } from "../middleware/auth.js";
import { createBooking } from "../controllers/bookings.controller.js";
const router = express.Router();

router.get("/", listServices);
router.get("/my", requireAuth, requireRole("provider"), requireProviderProfileComplete, myProviderServices);
router.post("/", requireAuth, requireRole("provider"), requireProviderProfileComplete, createService);
router.post("/", requireAuth, requireRole("customer"), createBooking);
export default router;