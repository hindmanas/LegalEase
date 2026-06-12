import { Router } from 'express';
import { getDocument, listDocuments, uploadDocument } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);
router.get('/', listDocuments);
router.post('/upload', upload.single('document'), uploadDocument);
router.get('/:id', getDocument);

export default router;
