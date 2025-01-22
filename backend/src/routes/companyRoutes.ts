import express from 'express';
import { createCompanyInfo, updateCompanyInfo, getCompanyInfo } from '../controllers/companyController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

router.get('/', getCompanyInfo);

router.post('/', authenticateUser, createCompanyInfo);
router.put('/', authenticateUser, updateCompanyInfo);


export default router;