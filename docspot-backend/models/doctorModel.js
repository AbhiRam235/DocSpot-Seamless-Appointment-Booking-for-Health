const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullname: { type: String, required: true, trim: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    fees: { type: Number, required: true },
    timings: {
      type: [String], // e.g. ["09:00", "17:00"]
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
