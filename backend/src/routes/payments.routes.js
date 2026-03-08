import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createPayment, getPaymentByBooking } from "../controllers/payments.controller.js";

const router = Router();

router.post("/", requireAuth, createPayment);
router.get("/booking/:bookingId", requireAuth, getPaymentByBooking);

export default router;