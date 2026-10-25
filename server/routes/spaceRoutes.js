// routes/spaceRoutes.js  ->  mounted at /api/spaces

const express = require("express");
const {
  listSpaces,
  spaceBoard,
  getSpace,
  createSpace,
  updateSpace,
  deleteSpace,
  spaceMeta,
} = require("../controllers/spaceController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Public
router.get("/board", spaceBoard);
router.get("/meta", spaceMeta);

// Logged-in users
router.get("/", protect, listSpaces);
router.get("/:id", protect, getSpace);

// Admins only
router.post("/", protect, adminOnly, createSpace);
router.put("/:id", protect, adminOnly, updateSpace);
router.delete("/:id", protect, adminOnly, deleteSpace);

module.exports = router;
