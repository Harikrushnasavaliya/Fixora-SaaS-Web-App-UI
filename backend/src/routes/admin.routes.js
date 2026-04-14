import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
    listProviders,
    updateProviderStatus,
    approveProvider,
    rejectProvider,
    listUsers,
    reactivateUser,
    listServices,
    toggleService,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/providers", requireAuth, requireRole("admin"), listProviders);
router.patch("/providers/:id/status", requireAuth, requireRole("admin"), updateProviderStatus);
router.patch("/providers/:id/approve", requireAuth, requireRole("admin"), approveProvider);
router.patch("/providers/:id/reject", requireAuth, requireRole("admin"), rejectProvider);
router.get("/users", requireAuth, requireRole("admin"), listUsers);
router.patch("/users/:id/reactivate", requireAuth, requireRole("admin"), reactivateUser);
router.get("/services", requireAuth, requireRole("admin"), listServices);
router.patch("/services/:id/toggle", requireAuth, requireRole("admin"), toggleService);

export default router;