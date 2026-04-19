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
    getBookingById,
} from "../controllers/bookings.controller.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("customer", "admin"), createBooking);
router.get("/my", requireAuth, requireRole("customer", "admin"), myBookings);
router.patch("/:id/cancel", requireAuth, requireRole("customer", "admin"), cancelBooking);
router.get("/provider", requireAuth, requireRole("provider", "admin"), providerBookings);
router.patch("/:id/status", requireAuth, requireRole("provider", "admin"), providerUpdateBookingStatus);
router.patch("/:id/reschedule", requireAuth, requestReschedule);
router.patch("/:id/reschedule/decision", requireAuth, requireRole("customer", "admin"), customerRescheduleDecision);
router.patch("/:id/reschedule/approve", requireAuth, approveReschedule);
router.patch("/:id/reschedule/reject", requireAuth, rejectReschedule);
router.patch("/:id/complete", requireAuth, requireRole("provider", "admin"), providerCompleteBooking, providerCompleteWork);
router.get("/:id", requireAuth, getBookingById);

export default router;