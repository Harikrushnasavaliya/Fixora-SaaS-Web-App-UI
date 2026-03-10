import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true, maxlength: 150 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },
    phone: { type: String, unique: true, trim: true, maxlength: 20 },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      index: true,
      required: true,
    },
    profile_image: { type: String },
    is_active: { type: Boolean, default: true, index: true },
    email_otp_hash: { type: String, default: null },
    email_otp_expires_at: { type: Date, default: null },
    is_email_verified: { type: Boolean, default: false },
    email_verify_token_hash: { type: String, default: null },
    email_verify_expires_at: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
