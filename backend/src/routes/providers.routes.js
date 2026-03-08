import { Router } from "express";
import { searchProviders, getProviderById } from "../controllers/providers.controller.js";

const router = Router();

router.get("/search", searchProviders);
router.get("/:id", getProviderById);

export default router;