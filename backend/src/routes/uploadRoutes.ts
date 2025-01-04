import { Router } from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/uploadController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Multer konfigürasyonu
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Sadece resim dosyalarına izin ver
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'));
        }
    }
});

// Upload route'u
router.post('/', authenticateUser, upload.single('file'), uploadFile);

export default router; 