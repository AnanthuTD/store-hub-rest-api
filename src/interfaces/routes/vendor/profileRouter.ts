import express from 'express';
import {
  updateAvatar,
  updatePassword,
} from '../../controllers/vendor/ProfileController';
import { upload } from '../../middleware/multerS3Config';
const profileRouter = express.Router();

// Route to update avatar
profileRouter.post('/update/avatar', upload.single('avatar'), updateAvatar);

// Route to update password
profileRouter.post('/update-password', updatePassword);

export default profileRouter;
