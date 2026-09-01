const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tags: [String],
  imageUrl: { type: String, default: null },   // ← new
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Post", postSchema);