const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  isdoctor: Boolean,
  type: String,
  notification: Array,
  seenNotification: Array,
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Check if admin already exists
  const existing = await User.findOne({ email: "admin@docspot.com" });
  if (existing) {
    console.log("Admin already exists! You can login with:");
    console.log("Email: admin@docspot.com");
    console.log("Password: admin123");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await User.create({
    name: "Admin",
    email: "admin@docspot.com",
    password: hashedPassword,
    phone: "9999999999",
    isdoctor: false,
    type: "admin",
    notification: [],
    seenNotification: [],
  });

  console.log("✅ Admin user created!");
  console.log("Email:    admin@docspot.com");
  console.log("Password: admin123");
  console.log("\nYou can now register normal users from the app's Register page.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});