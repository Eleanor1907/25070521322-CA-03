// models/Space.js
// A bookable workspace: a hot desk, a meeting room or a private cabin.

const mongoose = require("mongoose");

const SPACE_TYPES = ["hot-desk", "meeting-room", "private-cabin"];
const AMENITIES = [
  "Wi-Fi",
  "Power outlets",
  "Whiteboard",
  "TV screen",
  "Video conferencing",
  "Standing desk",
  "Natural light",
  "Air conditioning",
  "Lockable door",
];

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Space name is required."],
      unique: true,
      trim: true,
      maxlength: [60, "Name can be at most 60 characters."],
    },
    type: {
      type: String,
      required: [true, "Choose a space type."],
      enum: { values: SPACE_TYPES, message: "Type must be hot-desk, meeting-room or private-cabin." },
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required."],
      min: [1, "Capacity must be at least 1."],
      max: [50, "Capacity can be at most 50."],
      validate: { validator: Number.isInteger, message: "Capacity must be a whole number." },
    },
    floor: {
      type: String,
      required: [true, "Floor or location is required."],
      trim: true,
      maxlength: [30, "Floor can be at most 30 characters."],
    },
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required."],
      min: [0, "Hourly rate cannot be negative."],
      max: [10000, "Hourly rate can be at most ₹10,000."],
    },
    amenities: {
      type: [{ type: String, enum: { values: AMENITIES, message: "Unknown amenity: {VALUE}" } }],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description can be at most 300 characters."],
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true, // inactive spaces stay in the database but cannot be booked
    },
  },
  { timestamps: true }
);

spaceSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Space", spaceSchema);
module.exports.SPACE_TYPES = SPACE_TYPES;
module.exports.AMENITIES = AMENITIES;
