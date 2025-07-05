const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

const uploadTarget = process.env.UPLOAD_TARGET || 'cloudinary';

let storage;

if (uploadTarget === 'cloudinary') {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'delivery_orders',
      allowed_formats: ['pdf', 'doc', 'docx'],
    },
  });
} else {

  const localPath = path.join(__dirname, '../uploads/delivery_orders');
  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, localPath);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${timestamp}${ext}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF dan dokumen Word (DOC/DOCX) yang diizinkan'), false);
  }
};

const uploadDO = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter,
});

module.exports = uploadDO;
