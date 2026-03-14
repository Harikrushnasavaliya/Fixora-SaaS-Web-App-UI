import { Router } from "express";
import {
    register,
    login,
    verifyEmailLink,
    logout,
    me,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";


const router = Router();

router.post("/register", register);
router.post("/login", login);
// router.post("/verify-email", verifyEmail);
// router.post("/resend-otp", resendOtp);
router.get("/verify-link", verifyEmailLink);
router.get("/me", requireAuth, me);
router.post("/logout", logout);
export default router;