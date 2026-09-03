const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const requireAuth = require("../middleware/auth");

const multer = require("multer");
const uploadBufferToCloudinary = require("../utils/uploadToCloudinary");
const mongoose = require("mongoose");

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

      if (result.bytes > 500 * 1024) {
        imageThumbUrl = cloudinary.url(result.public_id, {
          quality: "auto:eco",
          fetch_format: "auto",
          width: 900,
          crop: "limit"
        });
      } else {
        imageThumbUrl = imageUrl; // already small — no point compressing further
      }
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
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "newest";

    const match = {};
    if (req.query.author) match.author = new mongoose.Types.ObjectId(req.query.author);

    let sortStage = { createdAt: -1 };
    if (sort === "oldest") sortStage = { createdAt: 1 };
    if (sort === "author") sortStage = { "authorInfo.name": 1 };

    const result = await Post.aggregate([
      { $match: match },
      { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorInfo" } },
      { $unwind: "$authorInfo" },
      { $sort: sortStage },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                title: 1, body: 1, tags: 1, createdAt: 1,
                imageUrl: 1, imageThumbUrl: 1,
                author: { _id: "$authorInfo._id", name: "$authorInfo.name", email: "$authorInfo.email" }
              }
            }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ]);

    const totalCount = result[0].totalCount[0]?.count || 0;

    res.json({
      posts: result[0].data,
      totalCount,
      page,
      totalPages: Math.max(Math.ceil(totalCount / limit), 1)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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
