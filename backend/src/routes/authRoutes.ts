import express from 'express';
import { login, logout, getSession } from '../controllers/authController';

const router = express.Router();

// Yönetici girişi
router.post('/login', login);

// Çıkış yap
router.post('/logout', logout);

router.get('/session', getSession);

export default router; 