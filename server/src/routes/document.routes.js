import { Router } from 'express';
import { getDocument, listDocuments, uploadDocument, deleteDocument } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { checkAnalysisQuota } from '../middleware/quota.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', listDocuments);
router.post('/upload', checkAnalysisQuota, upload.single('document'), uploadDocument);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

export default router;
