import express from 'express';
import { signInAdmin } from '../../controllers/admin/AdminController';
const adminRouter = express.Router();

adminRouter.post('/signin', signInAdmin);

export default adminRouter;
