import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import xss from 'xss-clean';
import hpp from 'hpp';
import companyRoutes from './routes/companyRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import visitorRoutes from './routes/visitorRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import { authenticateUser } from './middleware/auth';

const app = express();

// Güvenlik başlıkları
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100 // her IP için 15 dakikada maksimum 100 istek
});
app.use(limiter);

// XSS koruması
app.use(xss());

// HTTP Parameter Pollution koruması
app.use(hpp({
    whitelist: ['price', 'rating', 'limit', 'page'] // izin verilen duplicate parametreler
}));

// CORS ayarları
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
    credentials: true
}));

// Request boyut limitleri
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dosya yükleme güvenliği
app.use(fileUpload({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    useTempFiles: true,
    tempFileDir: '/tmp/',
    safeFileNames: true,
    preserveExtension: true,
    abortOnLimit: true,
    debug: false
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', authenticateUser, companyRoutes);
app.use('/api/upload', authenticateUser, uploadRoutes);
app.use('/api/visitors', authenticateUser, visitorRoutes);
app.use('/api/categories', authenticateUser, categoryRoutes);
app.use('/api/products', authenticateUser, productRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Hata:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Sunucu hatası' : err.message
    });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});

export default app;