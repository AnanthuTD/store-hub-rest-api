import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3Client } from '../../infrastructure/s3Client';
import env from '../../infrastructure/env/env';

export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: env.S3_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      const fileName = `${Date.now()}_${file.originalname}`;
      cb(null, fileName);
    },
  }),
});
