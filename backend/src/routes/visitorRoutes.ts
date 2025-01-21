import express from 'express';
import { getVisitorCount, incrementVisitorCount } from '../controllers/visitorController';

const router = express.Router();

router.get('/', getVisitorCount);
router.post('/increment', incrementVisitorCount);

export default router; 