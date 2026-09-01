require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();


////////

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  }
});

const uploadBufferToCloudinary = require("./utils/uploadToCloudinary");

// app.post("/upload-test", upload.single("image"), async (req, res) => {
//   try {
//     const result = await uploadBufferToCloudinary(req.file.buffer);
//     res.json({ url: result.secure_url });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

/////

app.use(cors());
app.use(express.json());
app.use("/users", require("./routes/users"));
app.use("/posts", require("./routes/posts"));
app.use("/posts/:postId/comments", require("./routes/comments"));
app.use("/stats", require("./routes/stats"));
//6a8d8fd31a77195a8aaf2194

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("Connection error:", err));

app.get("/", (req, res) => res.send("Blog API running"));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server on port http://localhost:${PORT}`))