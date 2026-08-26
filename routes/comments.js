const express = require("express");
const router = express.Router({ mergeParams: true });
const Comment = require("../models/Comment");
const requireAuth = require("../middleware/auth");

// Create comment on a post — now requires login
router.post("/", requireAuth, async (req, res) => {
  try {
    const comment = await Comment.create({
      text: req.body.text,
      author: req.userId,
      post: req.params.postId
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List comments for a post
router.get("/", async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId }).populate("author", "name email");
  res.json(comments);
});

module.exports = router;
