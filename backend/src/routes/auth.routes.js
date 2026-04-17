import { Router } from "express";
import {
    register,
    login,
    verifyEmailLink,
    logout,
    me,
    deactivateAccount,
    forgotPassword,
    resetPassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-link", verifyEmailLink);
router.get("/me", requireAuth, me);
router.post("/logout", logout);
router.post("/deactivate", requireAuth, deactivateAccount);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;