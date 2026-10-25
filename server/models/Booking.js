// models/Booking.js
// One reservation of one space by one user for a time range on a single day.
// Dates are stored as "YYYY-MM-DD" and times as "HH:MM" strings: they sort
// correctly as text and avoid time-zone surprises, which keeps the logic simple.

const mongoose = require("mongoose");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):(00|30)$/; // half-hour slots only

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // relationship: many bookings belong to one user
      required: true,
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space", // relationship: many bookings belong to one space
      required: [true, "Choose a space."],
    },
    date: {
      type: String,
      required: [true, "Pick a date."],
      match: [DATE_RE, "Date must look like YYYY-MM-DD."],
    },
    startTime: {
      type: String,
      required: [true, "Pick a start time."],
      match: [TIME_RE, "Start time must be on the hour or half hour (e.g. 09:30)."],
    },
    endTime: {
      type: String,
      required: [true, "Pick an end time."],
      match: [TIME_RE, "End time must be on the hour or half hour (e.g. 11:00)."],
    },
    attendees: {
      type: Number,
      required: [true, "Number of people is required."],
      min: [1, "At least 1 person must attend."],
      validate: { validator: Number.isInteger, message: "Number of people must be a whole number." },
    },
    purpose: {
      type: String,
      required: [true, "Add a short purpose, e.g. \"Client call\"."],
      trim: true,
      minlength: [3, "Purpose must be at least 3 characters."],
      maxlength: [120, "Purpose can be at most 120 characters."],
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    totalCost: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

// Speeds up the clash check: "bookings for this space on this day"
bookingSchema.index({ space: 1, date: 1, status: 1 });
bookingSchema.index({ user: 1, date: -1 });

bookingSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
