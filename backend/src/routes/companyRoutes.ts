import express from 'express';
import { createCompanyInfo, updateCompanyInfo, getCompanyInfo } from '../controllers/companyController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateUser, createCompanyInfo);
router.put('/:id', authenticateUser, updateCompanyInfo);
router.get('/', getCompanyInfo);

export default router;