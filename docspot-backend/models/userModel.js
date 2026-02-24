const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    isdoctor: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["user", "doctor", "admin"],
      default: "user",
    },
    notification: [
      {
        type: { type: String },
        message: { type: String },
        data: { type: Object },
        onClickPath: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    seenNotification: [
      {
        type: { type: String },
        message: { type: String },
        data: { type: Object },
        onClickPath: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
