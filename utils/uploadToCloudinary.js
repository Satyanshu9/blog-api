const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

function uploadBufferToCloudinary(buffer, folder = "the-nook") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

module.exports = uploadBufferToCloudinary;