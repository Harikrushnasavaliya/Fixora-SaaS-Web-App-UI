import { Router } from "express";
import { register, login, verifyEmailOtp, resendEmailOtp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmailOtp);
router.post("/resend-otp", resendEmailOtp);

export default router;