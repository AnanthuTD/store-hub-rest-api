import express from 'express';
import { checkUnreadMessages } from '../../controllers/checkUnreadMessage';

const router = express.Router();

// Route to check unread messages for a user
router.get('/unread-messages', checkUnreadMessages);

export default router;
