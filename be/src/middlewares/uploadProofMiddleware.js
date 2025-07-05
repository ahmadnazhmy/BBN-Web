const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const uploadTarget = process.env.UPLOAD_TARGET || 'cloudinary';

let storage;

if (uploadTarget === 'cloudinary') {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'bukti_pembayaran',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: [{ width: 800, crop: 'limit' }],
    },
  });
} else {
  const localUploadDir = path.join(__dirname, '..', 'uploads', 'proofs');

  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, localUploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });
}

const uploadProof = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file JPG, JPEG, PNG, dan PDF yang diizinkan'), false);
    }
  },
});

module.exports = uploadProof;
