import express from 'express';
import authRoutes from './authRoutes';

const router = express.Router();

router.get('/auth', authRoutes);

export default router;
