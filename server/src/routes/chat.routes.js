import { Router } from 'express';
import { chatWithDocument } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/:id', chatWithDocument);

export default router;
