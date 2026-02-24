const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");

// GET /api/user/me - get current user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/user/profile - update profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone },
      { new: true }
    ).select("-password");
    res.json({ success: true, message: "Profile updated", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/user/apply-doctor - apply to be a doctor
router.post("/apply-doctor", authMiddleware, async (req, res) => {
  try {
    const { fullname, email, phone, address, specialization, experience, fees, timings } = req.body;

    // Check if already applied
    const existing = await Doctor.findOne({ userId: req.userId });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already applied" });
    }

    const doctor = new Doctor({
      userId: req.userId,
      fullname,
      email,
      phone,
      address,
      specialization,
      experience,
      fees,
      timings,
      status: "pending",
    });
    await doctor.save();

    // Notify admins
    const admins = await User.find({ type: "admin" });
    for (const admin of admins) {
      admin.notification.push({
        type: "apply-doctor-request",
        message: `${fullname} has applied for doctor registration`,
        data: { doctorId: doctor._id, userId: req.userId },
        onClickPath: "/admin/doctors",
      });
      await admin.save();
    }

    res.status(201).json({ success: true, message: "Doctor application submitted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/user/notifications - get notifications
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("notification seenNotification");
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/user/mark-notifications-seen - mark all as seen
router.post("/mark-notifications-seen", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.seenNotification.push(...user.notification);
    user.notification = [];
    await user.save();
    res.json({ success: true, message: "Notifications marked as seen" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/user/delete-notifications - clear seen notifications
router.delete("/delete-notifications", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.notification = [];
    user.seenNotification = [];
    await user.save();
    res.json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/user/all-doctors - list approved doctors for users to browse
router.get("/all-doctors", authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: "approved" }).populate("userId", "name email");
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
