const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// Create post
router.post("/", async (req, res) => {
  try {
    const post = await Post.create(req.body);
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