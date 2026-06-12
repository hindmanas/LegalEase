import { Router } from 'express';
import { analyzeDocument, downloadReport } from '../controllers/analysis.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/:id', analyzeDocument);
router.get('/:id/report', downloadReport);

export default router;
