const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const User = require("../models/userModel");
const moment = require("moment");

// POST /api/appointment/book - book an appointment
router.post("/book", authMiddleware, upload.single("document"), async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: "Doctor, date, and time are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== "approved") {
      return res.status(404).json({ success: false, message: "Doctor not found or not approved" });
    }

    const user = await User.findById(req.userId).select("-password");

    // Check for duplicate booking
    const existing = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: ["pending", "scheduled"] },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "This time slot is already booked" });
    }

    const appointment = new Appointment({
      userId: req.userId,
      doctorId,
      userInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      doctorInfo: {
        fullname: doctor.fullname,
        specialization: doctor.specialization,
        fees: doctor.fees,
        address: doctor.address,
      },
      date,
      time,
      status: "pending",
      document: req.file ? `/uploads/${req.file.filename}` : "",
    });

    await appointment.save();

    // Notify the doctor
    const doctorUser = await User.findById(doctor.userId);
    if (doctorUser) {
      doctorUser.notification.push({
        type: "new-appointment-request",
        message: `New appointment request from ${user.name} on ${date}`,
        data: { appointmentId: appointment._id },
        onClickPath: "/doctor/appointments",
      });
      await doctorUser.save();
    }

    res.status(201).json({ success: true, message: "Appointment booked successfully", data: appointment });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/appointment/user - get user's appointments
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/appointment/:id/cancel - cancel appointment (by user)
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.userId });
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    if (!["pending", "scheduled"].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel this appointment" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Notify doctor
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const doctorUser = await User.findById(doctor.userId);
      if (doctorUser) {
        doctorUser.notification.push({
          type: "appointment-cancelled",
          message: `Appointment on ${appointment.date} has been cancelled by patient`,
          data: { appointmentId: appointment._id },
          onClickPath: "/doctor/appointments",
        });
        await doctorUser.save();
      }
    }

    res.json({ success: true, message: "Appointment cancelled", data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/appointment/availability/:doctorId - check doctor availability for a date
router.get("/availability/:doctorId", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const booked = await Appointment.find({
      doctorId: req.params.doctorId,
      date,
      status: { $in: ["pending", "scheduled"] },
    }).select("time");

    const bookedTimes = booked.map((a) => a.time);
    res.json({ success: true, data: { bookedTimes } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
