const express = require("express");
const router = express.Router();
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// Get my own profile
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Update my own profile
router.put("/me", requireAuth, async (req, res) => {
  try {
    const allowedUpdates = { name: req.body.name, email: req.body.email };
    // strip out any undefined fields, so we don't overwrite with empty values
    Object.keys(allowedUpdates).forEach(
      key => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    const user = await User.findByIdAndUpdate(req.userId, allowedUpdates, {
      new: true,
      runValidators: true
    }).select("-password");

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Change my password
router.put("/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }

    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create user
router.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List all users
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Get one user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

module.exports = router;
