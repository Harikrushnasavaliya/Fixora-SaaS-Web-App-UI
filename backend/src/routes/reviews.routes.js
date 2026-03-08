import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createReview, getProviderReviews } from "../controllers/reviews.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), createReview);
router.get("/provider/:providerId", getProviderReviews);

export default router;