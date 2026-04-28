// src/services/audit.service.js
import { AuditLog } from "../models/AuditLog.js";

export async function logAction(
  req,
  action,
  targetType = null,
  targetId = null,
  details = {},
) {
  try {
    if (!req?.user?._id) return;

    await AuditLog.create({
      actor_id: req.user._id,
      actor_email: req.user.email || "unknown",
      actor_role: req.user.role || "admin",
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || {},
      ip_address: req.ip || req.headers["x-forwarded-for"] || null,
      user_agent: req.headers["user-agent"] || null,
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
}
