import mongoose from "mongoose";

const providerDocumentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["id_front", "id_back", "address_proof", "other"],
      required: true,
    },
    url: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const providerProfileSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true },
    photo_url: { type: String, trim: true },
    address_line1: { type: String, trim: true },
    address_line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    service_radius_miles: { type: Number, default: 10 },
    title: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
    experience_years: { type: Number, default: 0 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    ssn_last4: { type: String, trim: true, minlength: 4, maxlength: 4 },
    documents: { type: [providerDocumentSchema], default: [] },
    is_available: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },

    password_hash: { type: String, required: true },
    role: { type: String, enum: ["customer", "provider", "admin"], required: true },
    is_active: { type: Boolean, default: true },
    is_email_verified: { type: Boolean, default: false },
    // email_otp_hash: { type: String },
    // email_otp_expires_at: { type: Date },
    email_verify_token_hash: { type: String },
    email_verify_expires_at: { type: Date },
    is_profile_complete: { type: Boolean, default: false },
    has_created_service: { type: Boolean, default: false },
    provider_status: {
      type: String,
      enum: ["draft", "pending_verification", "verified", "rejected"],
      default: "draft",
    },
    provider_profile: { type: providerProfileSchema, default: {} },
    provider_profile: {
      phone: { type: String, trim: true },
      ssn_last4: { type: String, trim: true },
      photo_url: { type: String, trim: true },
      address: { type: String, trim: true },
      verification_doc_url: { type: String, trim: true },
      is_available: { type: Boolean, default: true },
    },
    is_profile_complete: { type: Boolean, default: false },
    provider_status: { type: String, enum: ["draft", "pending", "verified", "rejected"], default: "draft" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);

