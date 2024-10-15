import express from 'express';
import adminUserController from '../../controllers/admin/adminUserController';
const userRouter = express.Router();

userRouter.get('/', adminUserController.getUsers);

export default userRouter;
