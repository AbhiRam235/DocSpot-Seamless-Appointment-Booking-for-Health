const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    userInfo: { type: Object, required: true },
    doctorInfo: { type: Object, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending",
    },
    document: { type: String, default: "" }, // file path
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
