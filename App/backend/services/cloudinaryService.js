const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const uploadFile = async (localPath, folder) => {
  const uploadOptions = { folder: folder || process.env.FOLDER_NAME };
  const result = await cloudinary.uploader.upload(localPath, uploadOptions);
  return {
    publicId: result.public_id,
    url: result.secure_url,
    filename: result.original_filename + (result.format ? '.' + result.format : ''),
    bytes: result.bytes
  };
};

const deleteFile = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadFile, deleteFile };







