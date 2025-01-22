import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import xss from 'xss-clean';
import hpp from 'hpp';
import dotenv from 'dotenv';
import { productRoutes } from './routes/productRoutes';
import { authRoutes } from './routes/authRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { companyRoutes } from './routes/companyRoutes';
import { uploadRoutes } from './routes/uploadRoutes';
import { visitorRoutes } from './routes/visitorRoutes';
import { authenticateUser } from './middleware/auth';

dotenv.config();

const app: Express = express();

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

// FRONTEND_URL için tip güvenli tanımlama
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS ayarları için tip güvenli tanımlama
const corsOptions = {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
    credentials: true
};

// CORS middleware'i uygula
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dosya yükleme ayarları
app.use(fileUpload({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    useTempFiles: !process.env.VERCEL,
    tempFileDir: process.env.VERCEL ? null : '/tmp/',
    safeFileNames: true,
    preserveExtension: true,
    abortOnLimit: true,
    debug: process.env.NODE_ENV !== 'production'
}));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/company', authenticateUser, companyRoutes);
app.use('/api/upload', authenticateUser, uploadRoutes);
app.use('/api/visitors', authenticateUser, visitorRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Hata:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Sunucu hatası' : err.message
    });
});

// Port tanımlaması için tip güvenli yaklaşım
const PORT: number = parseInt(process.env.PORT || '3001', 10);
const HOST: string = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// Eğer çoklu origin desteği gerekiyorsa:
const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    [FRONTEND_URL];

const corsOptionsWithMultipleOrigins = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
    credentials: true
};

app.use(cors(corsOptionsWithMultipleOrigins));

// Vercel ve diğer ortamlar için uyumlu başlatma
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, HOST, () => {
        console.log(`Server is running on http://${HOST}:${PORT}`);
    });
}

export default app;