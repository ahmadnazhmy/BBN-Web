const multer = require('multer')
const path = require('path')
const fs = require('fs')

const storageFolder = path.join(__dirname, '../uploads/payments')

if (!fs.existsSync(storageFolder)) {
  fs.mkdirSync(storageFolder, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storageFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `proof-${Date.now()}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Hanya file gambar (jpg, jpeg, png) yang diizinkan'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 
  }
})

module.exports = upload
