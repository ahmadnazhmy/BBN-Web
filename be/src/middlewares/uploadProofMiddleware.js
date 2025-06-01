const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bukti_pembayaran',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'], 
    transformation: [{ width: 800, crop: 'limit' }],
  },
});

const uploadProof = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, JPEG, PNG) dan PDF yang diizinkan'), false);
    }
  },
});

module.exports = uploadProof;