import express from 'express';
import {
  updateAvatar,
  updatePassword,
  updateProfile,
} from '../../controllers/user/ProfileController';
import { upload } from '../../middleware/multerS3Config';
const userProfileRouter = express.Router();

// Route to update avatar
userProfileRouter.post('/update/avatar', upload.single('avatar'), updateAvatar);

// Route to update password
userProfileRouter.post('/update-password', updatePassword);

userProfileRouter.post('/update-profile', updateProfile);

export default userProfileRouter;
