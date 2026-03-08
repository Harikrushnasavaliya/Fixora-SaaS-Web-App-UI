import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { User } from "../models/Users.js";
import { sendEmail, otpEmailTemplate } from "../utils/mailer.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function validatePassword(pw) {
  // min 8, at least 1 letter + 1 number (simple strong rule)
  if (typeof pw !== "string") return "Password is required";
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must contain letter and number";
  return null;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

async function setOtp(user) {
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const mins = Number(process.env.OTP_EXPIRES_MIN || 10);

  user.email_otp_hash = otpHash;
  user.email_otp_expires_at = new Date(Date.now() + mins * 60 * 1000);
  await user.save();

  const tpl = otpEmailTemplate({ otp, minutes: mins });
  await sendEmail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });

  // Remove otp from response in real usage
  return otp;
}

export async function register(req, res) {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // basic validation
    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ message: "Full name must be at least 2 characters" });
    }
    if (!email || !validator.isEmail(String(email))) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (phone && !validator.isMobilePhone(String(phone), "any")) {
      return res.status(400).json({ message: "Invalid phone number" });
    }
    if (!role || !["customer", "provider", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ message: pwErr });

    const emailLower = String(email).toLowerCase();

    const emailExists = await User.findOne({ email: emailLower });
    if (emailExists) return res.status(409).json({ message: "Email already exists" });

    if (phone) {
      const phoneExists = await User.findOne({ phone: String(phone).trim() });
      if (phoneExists) return res.status(409).json({ message: "Phone already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name: full_name.trim(),
      email: emailLower,
      phone: phone ? String(phone).trim() : undefined,
      password_hash,
      role,
      is_active: true,
      is_email_verified: false,
    });

    const otp = await setOtp(user);

    return res.status(201).json({
      message: "Registered. Verify email with OTP.",
      user: { id: user._id, email: user.email, role: user.role, is_email_verified: user.is_email_verified },
      otp_dev_only: otp, // ✅ remove in production
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function verifyEmailOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !validator.isEmail(String(email))) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (!otp || String(otp).length !== 6) {
      return res.status(400).json({ message: "OTP must be 6 digits" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is_email_verified) {
      return res.json({ message: "Email already verified" });
    }

    if (!user.email_otp_expires_at || user.email_otp_expires_at < new Date()) {
      return res.status(400).json({ message: "OTP expired. Resend OTP." });
    }

    const ok = await bcrypt.compare(String(otp), user.email_otp_hash || "");
    if (!ok) return res.status(400).json({ message: "Invalid OTP" });

    user.is_email_verified = true;
    user.email_otp_hash = undefined;
    user.email_otp_expires_at = undefined;
    await user.save();

    const token = signToken(user);

    return res.json({
      message: "Email verified ✅",
      token,
      user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function resendEmailOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(String(email))) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is_email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const otp = await setOtp(user);

    return res.json({
      message: "OTP resent.",
      otp_dev_only: otp, // ✅ remove in production
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !validator.isEmail(String(email))) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (!password) return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.is_active) return res.status(403).json({ message: "Account disabled" });

    // role check if your UI selects role at login
    if (role && user.role !== role) return res.status(401).json({ message: "Role mismatch" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.is_email_verified) {
      return res.status(403).json({ message: "Email not verified. Please verify OTP." });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}