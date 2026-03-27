import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
    createBooking,
    myBookings,
    cancelBooking,
    providerBookings,
    providerUpdateBookingStatus,
    requestReschedule,
    customerRescheduleDecision,
    providerCompleteBooking,
    providerCompleteWork,
    approveReschedule,
    rejectReschedule,
} from "../controllers/bookings.controller.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("customer"), createBooking);
router.get("/my", requireAuth, requireRole("customer"), myBookings);
router.patch("/:id/cancel", requireAuth, requireRole("customer"), cancelBooking);
router.get("/provider", requireAuth, requireRole("provider"), providerBookings);
router.patch("/:id/status", requireAuth, requireRole("provider"), providerUpdateBookingStatus);
router.patch("/:id/reschedule", requireAuth, requestReschedule);
router.patch("/:id/reschedule/decision", requireAuth, requireRole("customer"), customerRescheduleDecision);
router.patch(
    "/:id/complete",
    requireAuth,
    requireRole("provider"),
    providerCompleteBooking,
    providerCompleteWork,
);
router.patch("/:id/reschedule/approve", requireAuth, approveReschedule);
router.patch("/:id/reschedule/reject", requireAuth, rejectReschedule);
export default router;