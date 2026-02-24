const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");

// GET /api/doctor/profile - get doctor profile for logged-in doctor user
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/doctor/profile - update doctor profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { fullname, phone, address, specialization, experience, fees, timings } = req.body;
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.userId },
      { fullname, phone, address, specialization, experience, fees, timings },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });
    res.json({ success: true, message: "Profile updated", data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/doctor/appointments - get all appointments for this doctor
router.get("/appointments", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const appointments = await Appointment.find({ doctorId: doctor._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/doctor/appointment/:id/status - update appointment status
router.put("/appointment/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    appointment.status = status;
    await appointment.save();

    // Notify the patient
    const patient = await User.findById(appointment.userId);
    if (patient) {
      patient.notification.push({
        type: "appointment-status-changed",
        message: `Your appointment on ${appointment.date} has been ${status}`,
        data: { appointmentId: appointment._id },
        onClickPath: "/appointments",
      });
      await patient.save();
    }

    res.json({ success: true, message: `Appointment ${status}`, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/doctor/:id - get a specific doctor's public info
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId", "name email");
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
