import { Router } from 'express';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllCategories);

// Protected routes (yönetici girişi gerekli)
router.post('/', authenticateUser, createCategory);
router.put('/:id', authenticateUser, updateCategory);
router.delete('/:id', authenticateUser, deleteCategory);

export default router; 