import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/Users.js";
import { sendEmail, otpEmailTemplate } from "../utils/mailer.js";
import crypto from "crypto";

function makeVerifyToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function setAndSendOtp(user) {
  const otp = generateOtp();
  const mins = Number(process.env.OTP_EXPIRES_MIN || 10);

  user.email_otp_hash = await bcrypt.hash(otp, 10);
  user.email_otp_expires_at = new Date(Date.now() + mins * 60 * 1000);
  await user.save();

  const tpl = otpEmailTemplate({ otp, minutes: mins });

  // send OTP email
  await sendEmail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
  return otp;
}

export async function register(req, res) {
  try {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const emailLower = String(email).toLowerCase();

    const exists = await User.findOne({ email: emailLower });

    if (exists) {
      if (exists.is_email_verified) {
        return res.status(409).json({ message: "Email already registered. Please login." });
      }
      const mins = Number(process.env.VERIFY_LINK_EXPIRES_MIN || 60);
      const { token, tokenHash } = makeVerifyToken();
      exists.email_verify_token_hash = tokenHash;
      exists.email_verify_expires_at = new Date(Date.now() + mins * 60 * 1000);
      await exists.save();
      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(exists.email)}`;
      await sendEmail({
        to: exists.email,
        subject: "Verify your Fixora account (link resent)",
        html: `
      <h2>Verify your Fixora email</h2>
      <p>Your previous link expired. Click this new link:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>This link expires in ${mins} minutes.</p>
    `,
        text: `Verify Email: ${verifyUrl}`,
      });

      return res.status(200).json({
        message: "Account already created but not verified. New verification link sent to your email.",
        user: { id: exists._id, email: exists.email, is_email_verified: false },
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email: emailLower,
      phone,
      password_hash,
      role,
      is_active: true,
      is_email_verified: false,
    });

    const mins = Number(process.env.VERIFY_LINK_EXPIRES_MIN || 60);
    const { token, tokenHash } = makeVerifyToken();

    user.email_verify_token_hash = tokenHash;
    user.email_verify_expires_at = new Date(Date.now() + mins * 60 * 1000);
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your Fixora account",
      html: `
        <h2>Verify your Fixora email</h2>
        <p>Click this link to verify:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link expires in ${mins} minutes.</p>
      `,
      text: `Verify Email: ${verifyUrl}`,
    });

    return res.status(201).json({
      message: "Registered. Verification link sent to your email.",
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is_email_verified) {
      return res.json({ message: "Email already verified" });
    }

    if (!user.email_otp_expires_at || user.email_otp_expires_at < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please resend OTP." });
    }

    const ok = await bcrypt.compare(String(otp), user.email_otp_hash || "");
    if (!ok) return res.status(400).json({ message: "Invalid OTP" });

    await User.updateOne(
      { _id: user._id },
      {
        $set: { is_email_verified: true },
        $unset: { email_otp_hash: "", email_otp_expires_at: "" },
      }
    );

    const token = signToken(user);

    return res.json({
      message: "Email verified ✅",
      token,
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function verifyEmailLink(req, res) {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).json({ message: "Missing token/email" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is_email_verified) return res.json({ message: "Already verified" });

    if (!user.email_verify_expires_at || user.email_verify_expires_at < new Date()) {
      return res.status(400).json({ message: "Verification link expired. Please signup again or resend." });
    }

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    if (tokenHash !== user.email_verify_token_hash) {
      return res.status(400).json({ message: "Invalid verification link" });
    }

    user.is_email_verified = true;
    user.email_verify_token_hash = null;
    user.email_verify_expires_at = null;
    await user.save();

    return res.json({ message: "Email verified ✅ You can login now." });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function resendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is_email_verified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const otp = await setAndSendOtp(user);
    return res.json({ message: "OTP resent", otp_dev_only: otp });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (role && user.role !== role) {
      return res.status(401).json({ message: "Role mismatch" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.is_email_verified) {
      return res.status(403).json({ message: "Email not verified. Please check your email verification link." });
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