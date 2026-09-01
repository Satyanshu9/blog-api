const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const requireAuth = require("../middleware/auth");

const multer = require("multer");
const uploadBufferToCloudinary = require("../utils/uploadToCloudinary");

  
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  }
});

// Create post — now accepts an optional image
router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  try {
    let imageUrl = null;

    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const tags = req.body.tags
      ? req.body.tags.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const post = await Post.create({
      title: req.body.title,
      body: req.body.body,
      tags,
      imageUrl,
      author: req.userId
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List posts — with optional ?author=id filter
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.author) filter.author = req.query.author;

  const posts = await Post.find(filter).populate("author", "name email");
  res.json(posts);
});

// Get one post (populated)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name email");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// Update post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete post
router.delete("/:id", async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json({ message: "Post deleted" });
});

module.exports = router;
