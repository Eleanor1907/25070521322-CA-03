// routes/bookingRoutes.js  ->  mounted at /api/bookings
// Every booking route needs a logged-in user.

const express = require("express");
const {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  bookingSummary,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/summary", bookingSummary); // must come before "/:id"
router.get("/", listBookings);
router.post("/", createBooking);
router.get("/:id", getBooking);
router.put("/:id", updateBooking);
router.patch("/:id/cancel", cancelBooking);
router.delete("/:id", deleteBooking);

module.exports = router;
