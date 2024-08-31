import express from 'express';
import { signInAdmin } from '../controllers/admin/AdminController';

const router = express.Router();

router.post('/signin', signInAdmin);

export default router;
