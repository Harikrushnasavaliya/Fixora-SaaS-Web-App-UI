import { Router } from "express";
import {
    register,
    login,
    verifyEmail,
    resendOtp,
    verifyEmailLink,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.get("/verify-link", verifyEmailLink);
export default router;