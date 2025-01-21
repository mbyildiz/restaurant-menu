import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Upload route'u
router.post('/image', authenticateUser, uploadFile);

export default router; 