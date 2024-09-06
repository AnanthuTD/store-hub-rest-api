import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destDir = 'uploads/partner/';
    // Check if the destination directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG files are allowed'));
    }
    cb(null, true);
  },
  dest: 'uploads/partner/', // Default destination directory
  onError: (err, next) => {
    // Handle errors during file upload
    console.error('Error during file upload:', err);
    next(err);
  },
});

export default upload;
