import express from 'express';
import { ThemeController } from '../controllers/themeController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Tema ayarlarını getir
router.get('/:company_id', ThemeController.getThemeSettings);

// Yeni tema ayarı oluştur (auth gerekli)
router.post('/:company_id', authenticateUser, ThemeController.createThemeSettings);

// Tema ayarlarını güncelle (auth gerekli)
router.put('/:company_id', authenticateUser, ThemeController.updateThemeSettings);

// Aktif temayı değiştir (auth gerekli)
router.put('/:company_id/active/:theme_id', authenticateUser, ThemeController.setActiveTheme);

export default router; 