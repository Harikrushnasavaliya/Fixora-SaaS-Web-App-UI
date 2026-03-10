import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createBooking,
  myBookings,
  providerJobs,
  updateBookingStatus,
  cancelBooking,
} from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("customer"), createBooking);
router.get("/my", requireAuth, requireRole("customer"), myBookings);

router.get("/provider/jobs", requireAuth, requireRole("provider"), providerJobs);
router.patch("/:id/status", requireAuth, updateBookingStatus);

router.patch("/:id/cancel", requireAuth, cancelBooking);

export default router;