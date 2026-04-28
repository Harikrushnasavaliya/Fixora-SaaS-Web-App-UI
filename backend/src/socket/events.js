// Shared event names. Both backend emits + frontend listens use these strings.
// If you change one, change it everywhere.

export const EVENTS = {
  // Connection lifecycle
  CONNECTED: "connected",
  ERROR: "socket_error",

  // Booking lifecycle (emitted to customer + provider rooms)
  BOOKING_CREATED: "booking:created",
  BOOKING_ACCEPTED: "booking:accepted",
  BOOKING_REJECTED: "booking:rejected",
  BOOKING_CONFIRMED: "booking:confirmed",
  BOOKING_CANCELLED: "booking:cancelled",
  BOOKING_WORK_COMPLETED: "booking:work_completed",
  BOOKING_COMPLETED: "booking:completed",
  BOOKING_UPDATED: "booking:updated",

  // Reschedule
  RESCHEDULE_REQUESTED: "booking:reschedule_requested",
  RESCHEDULE_APPROVED: "booking:reschedule_approved",
  RESCHEDULE_REJECTED: "booking:reschedule_rejected",

  // Payments
  PAYMENT_INTENT_CREATED: "payment:intent_created",
  PAYMENT_SUCCEEDED: "payment:succeeded",
  PAYMENT_FAILED: "payment:failed",
  PAYMENT_REFUNDED: "payment:refunded",

  // Reviews
  REVIEW_CREATED: "review:created",

  // Issues
  ISSUE_CREATED: "issue:created",
  ISSUE_RESOLVED: "issue:resolved",

  // Location tracking (already in your app — kept compatible)
  JOIN_BOOKING: "join_booking",
  PROVIDER_LOCATION: "provider_location",
  LOCATION_UPDATE: "location_update",
  PROVIDER_ARRIVED: "provider_arrived",

  // Admin live feed
  ADMIN_NEW_USER: "admin:new_user",
  ADMIN_NEW_BOOKING: "admin:new_booking",
  ADMIN_NEW_PAYMENT: "admin:new_payment",
  ADMIN_NEW_ISSUE: "admin:new_issue",
  ADMIN_NEW_REVIEW: "admin:new_review",
  ADMIN_REVIEW_UPDATED: "admin:review_updated",
  ADMIN_REVIEW_DELETED: "admin:review_deleted",
  ADMIN_REVIEW_TOGGLED: "admin:review_toggled",

  // Provider dashboard
  PROVIDER_NEW_REQUEST: "provider:new_request",
  PROVIDER_AVAILABILITY_CHANGED: "provider:availability_changed",
};

export const ROOMS = {
  user: (id) => `user:${id}`,
  booking: (id) => `booking:${id}`,
  provider: (id) => `provider:${id}`,
  admin: "admin",
};
