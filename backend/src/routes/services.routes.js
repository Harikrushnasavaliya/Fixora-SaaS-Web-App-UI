import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
    createService,
    listServices,
    myProviderServices,
    updateMyService,
    toggleMyService,
    deleteMyService,
} from "../controllers/services.controller.js";

const router = express.Router();

router.get("/", listServices);
router.post("/", requireAuth, requireRole("provider"), createService);
router.get("/my", requireAuth, requireRole("provider"), myProviderServices);
router.patch("/my/:id", requireAuth, requireRole("provider"), updateMyService);
router.patch("/my/:id/toggle", requireAuth, requireRole("provider"), toggleMyService);
router.delete("/my/:id", requireAuth, requireRole("provider"), deleteMyService);

export default router;