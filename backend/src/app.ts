import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import companyRoutes from './routes/companyRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import visitorRoutes from './routes/visitorRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import { authenticateUser } from './middleware/auth';
import * as categoryController from './controllers/categoryController';

const app = express();

// CORS ayarları
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: false
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Hata:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Sunucu hatası'
    });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '127.0.0.1';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});

export default app;