import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/Users.js";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export async function register(req, res) {
  try {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email: email.toLowerCase(),
      phone,
      password_hash,
      role,
      is_active: true,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (role && user.role !== role) {
      return res.status(401).json({ message: "Role mismatch" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user._id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}