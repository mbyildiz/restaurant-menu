import { Router } from 'express';
import {
    getAllProducts,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/category/:category', getProductsByCategory);

// Protected routes (yönetici girişi gerekli)
router.post('/', authenticateUser, createProduct);
router.put('/:id', authenticateUser, updateProduct);
router.delete('/:id', authenticateUser, deleteProduct);

export default router; 