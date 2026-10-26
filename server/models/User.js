// models/User.js
// A person who can log in to Pine.
// role "member" books spaces; role "admin" also manages spaces and sees every booking.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [60, "Name can be at most 60 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true, // MongoDB creates a unique index -> duplicate emails are rejected
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters."],
      select: false, // never returned by queries unless we ask for it explicitly
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Hash the password before saving (only when it was set or changed)
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plain password typed at login with the stored hash
userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

// Remove sensitive/internal fields whenever a user is sent as JSON
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
