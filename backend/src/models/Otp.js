import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    contact: { type: String, required: true, index: true }, // email or phone
    type: { type: String, enum: ["email", "phone"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);
