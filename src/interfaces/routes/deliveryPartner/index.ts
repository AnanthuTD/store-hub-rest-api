import express from 'express';
import authRouter from './auth';
import protectedRoutes from './protected';
const partnerRouter = express.Router();

partnerRouter.use('/auth', authRouter);
partnerRouter.use('/', protectedRoutes);

export default partnerRouter;
