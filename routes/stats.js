const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

router.get("/top-authors", async (req, res) => {
  const results = await Post.aggregate([
    {
      $group: {
        _id: "$author",
        postCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "users",           // actual collection name (lowercase, plural)
        localField: "_id",       // the grouped author id
        foreignField: "_id",
        as: "authorInfo"
      }
    },
    {
      $unwind: "$authorInfo"     // authorInfo comes back as an array — flatten to one object
    },
    {
      $project: {
        _id: 0,
        authorId: "$_id",
        name: "$authorInfo.name",
        email: "$authorInfo.email",
        postCount: 1
      }
    },
    {
      $sort: { postCount: -1 }
    }
  ]);

  res.json(results);
});

module.exports = router;