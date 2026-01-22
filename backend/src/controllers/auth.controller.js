import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";
import { sendOtp } from "../utils/mailer.js";

/* ===============================
   Generate JWT Token
================================ */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/* ===============================
   REGISTER USER
================================ */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2️⃣ Validate role
    const allowedRoles = ["driver", "passenger"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // 3️⃣ Normalize email
    const normalizedEmail = email.toLowerCase();

    // 4️⃣ Check existing user
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // 5️⃣ Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      phone,
    });

    // 6️⃣ Generate token
    const token = generateToken(user._id);

    // 7️⃣ Send token + user (MATCH LOGIN RESPONSE)
    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};


/* ===============================
   LOGIN USER
================================ */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    // 2️⃣ Find user (include password)
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4️⃣ Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

/* ===============================
   GET CURRENT USER
================================ */
export const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    return res.status(200).json({
      _id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};


/* ===============================
   REQUEST OTP (rate-limited)
   POST /api/auth/request-otp
   body: { contact, type }
================================ */
export const requestOtp = async (req, res) => {
  try {
    let { contact, type } = req.body;
    if (!contact || !type || !["email", "phone"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid contact/type" });
    }

    if (type === "email") contact = contact.toLowerCase();

    // Per-contact cooldown: not more than 1 request per 60 seconds
    const recent = await Otp.findOne({ contact, type }).sort({ createdAt: -1 });
    if (recent) {
      const ageMs = Date.now() - new Date(recent.createdAt).getTime();
      if (ageMs < 60_000) {
        return res.status(429).json({ success: false, message: "Please wait before requesting another OTP (60s cooldown)" });
      }
    }

    // Per-hour cap: max 5 requests in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await Otp.countDocuments({ contact, type, createdAt: { $gte: oneHourAgo } });
    if (recentCount >= 5) {
      return res.status(429).json({ success: false, message: "Too many OTP requests. Try again later." });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // hash & store
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.findOneAndUpdate(
      { contact, type },
      { codeHash, expiresAt, attempts: 0, used: false },
      { upsert: true, new: true }
    );

    try {
      await sendOtp({ contact, type, otp });
    } catch (err) {
      console.error("SendOtp error:", err.message);
      return res.status(500).json({ success: false, message: "Failed to send OTP" });
    }

    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("requestOtp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   VERIFY OTP (attempt-limited)
   POST /api/auth/verify-otp
   body: { contact, type, otp }
================================ */
export const verifyOtp = async (req, res) => {
  try {
    let { contact, type, otp } = req.body;
    if (!contact || !type || !otp) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    if (type === "email") contact = contact.toLowerCase();

    const record = await Otp.findOne({ contact, type });
    if (!record) return res.status(400).json({ success: false, message: "No OTP requested" });
    if (record.used) return res.status(400).json({ success: false, message: "OTP already used" });
    if (new Date() > record.expiresAt) return res.status(400).json({ success: false, message: "OTP expired" });

    const match = await bcrypt.compare(otp, record.codeHash);
    if (!match) {
      record.attempts = (record.attempts || 0) + 1;
      // if attempts exceed threshold, mark used/lock to prevent brute force
      if (record.attempts >= 5) {
        record.used = true;
      }
      await record.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // successful verify
    record.used = true;
    await record.save();

    // find or create user (auto passenger)
    let user = null;
    if (type === "email") {
      user = await User.findOne({ email: contact.toLowerCase() });
    } else {
      user = await User.findOne({ phone: contact });
    }

    if (!user) {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const userData = {
        name: type === "email" ? contact.split("@")[0] : "Passenger",
        role: "passenger",
        password: generatedPassword,
      };
      if (type === "email") userData.email = contact.toLowerCase();
      if (type === "phone") userData.phone = contact;
      user = await User.create(userData);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

    return res.status(200).json({
      success: true,
      message: "OTP verified",
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
