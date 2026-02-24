const express = require("express");
const router = express.Router();
const { adminMiddleware } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");

// GET /api/admin/users - list all users
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/doctors - list all doctors (all statuses)
router.get("/doctors", adminMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/doctor/:id/status - approve or reject doctor
router.put("/doctor/:id/status", adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // "approved" or "rejected"
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    // Update user's isdoctor flag
    const user = await User.findById(doctor.userId);
    if (user) {
      user.isdoctor = status === "approved";
      if (status === "approved") user.type = "doctor";
      // Notify the doctor
      user.notification.push({
        type: "doctor-account-request",
        message: `Your doctor application has been ${status}`,
        data: { doctorId: doctor._id },
        onClickPath: "/profile",
      });
      await user.save();
    }

    res.json({ success: true, message: `Doctor ${status}`, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/doctor/:id - remove doctor
router.delete("/doctor/:id", adminMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    // Reset user's doctor flag
    await User.findByIdAndUpdate(doctor.userId, { isdoctor: false, type: "user" });

    res.json({ success: true, message: "Doctor removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/user/:id - remove user
router.delete("/user/:id", adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/appointments - all appointments
router.get("/appointments", adminMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/stats - dashboard stats
router.get("/stats", adminMiddleware, async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalAppointments, pendingDoctors] = await Promise.all([
      User.countDocuments({ type: "user" }),
      Doctor.countDocuments({ status: "approved" }),
      Appointment.countDocuments(),
      Doctor.countDocuments({ status: "pending" }),
    ]);
    res.json({
      success: true,
      data: { totalUsers, totalDoctors, totalAppointments, pendingDoctors },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
