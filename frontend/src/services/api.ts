import axios, { AxiosError } from 'axios';
import { ApiService, ApiResponse, Product } from '../types';
import { supabase } from '../config/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// API Yanıt Tipi
interface ApiErrorResponse {
    success: false;
    error: string;
    details?: any;
}

// Her istekte token'ı ekle
api.interceptors.request.use(
    async (config) => {
        // Public endpoint'ler için token kontrolü yapma
        const publicEndpoints = ['/visitors', '/categories', '/products', '/company'];
        const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.startsWith(endpoint));
        const isPublicMethod = config.method?.toLowerCase() === 'get';

        // Sadece GET istekleri için public erişime izin ver
        if (!(isPublicEndpoint && isPublicMethod)) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Aktif oturum bulunamadı');
            }
            config.headers.Authorization = `Bearer ${session.access_token}`;
            localStorage.setItem('token', session.access_token);
        }

        // FormData için Content-Type header'ını ayarla
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
        if (error.response?.status === 401) {
            // Session'ı kontrol et
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Session yoksa çıkış yap
                await supabase.auth.signOut();
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

// Auth endpoints
export const auth: ApiService['auth'] = {
    login: async (email: string, password: string) => {
        const { data: { session }, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (!session) throw new Error('Oturum oluşturulamadı');

        localStorage.setItem('token', session.access_token);

        return {
            success: true,
            data: {
                user: session.user,
                session: {
                    access_token: session.access_token
                }
            }
        };
    },
    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        window.location.href = '/login';
        return { success: true, data: null };
    },
    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.access_token) {
            localStorage.setItem('token', session.access_token);
        }

        return {
            success: true,
            data: session ? {
                user: session.user,
                token: session.access_token
            } : { session: null }
        };
    }
};

// Company endpoints
export const company: ApiService['company'] = {
    getInfo: async () => {
        const response = await api.get<ApiResponse<any>>('/company');
        return response.data;
    },
    update: async (data) => {
        const response = await api.put<ApiResponse<any>>('/company', data);
        return response.data;
    },
    uploadLogo: async (file: File) => {
        try {
            const timestamp = Date.now();
            const fileName = `company-logo-${timestamp}${file.name.substring(file.name.lastIndexOf('.'))}`;

            const { data, error } = await supabase.storage
                .from('company-logos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Logo yükleme hatası:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('company-logos')
                .getPublicUrl(fileName);

            return {
                success: true,
                url: publicUrl
            };
        } catch (error) {
            console.error('Logo yükleme hatası:', error);
            throw error;
        }
    },
    uploadBanner: async (file: File) => {
        try {
            const timestamp = Date.now();
            const fileName = `company-banner-${timestamp}${file.name.substring(file.name.lastIndexOf('.'))}`;

            const { data, error } = await supabase.storage
                .from('banner-img')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Banner yükleme hatası:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('banner-img')
                .getPublicUrl(fileName);

            return {
                success: true,
                url: publicUrl
            };
        } catch (error) {
            console.error('Banner yükleme hatası:', error);
            throw error;
        }
    }
};

// Categories endpoints
export const categories: ApiService['categories'] = {
    getAll: async () => {
        const response = await api.get<ApiResponse<any[]>>('/categories');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<ApiResponse<any>>(`/categories/${id}`);
        return response.data;
    },
    create: async (formData: FormData) => {
        const response = await api.post<ApiResponse<any>>('/categories', formData);
        return response.data;
    },
    update: async (id: string, formData: FormData) => {
        const response = await api.put<ApiResponse<any>>(`/categories/${id}`, formData);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<{ message: string }>>(`/categories/${id}`);
        return response.data;
    },
    updateOrder: async (categories: { id: string; order_number: number }[]) => {
        const response = await api.post<ApiResponse<{ message: string }>>('/categories/order', { categories });
        return response.data;
    }
};

// Products endpoints
export const products: ApiService['products'] = {
    getAll: async () => {
        const response = await api.get<ApiResponse<any[]>>('/products');
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<ApiResponse<any>>(`/products/${id}`);
        return response.data;
    },
    getByCategory: async (categoryId: string) => {
        const response = await api.get<ApiResponse<any[]>>(`/products/category/${categoryId}`);
        return response.data;
    },
    create: async (data: Partial<Product>) => {
        const response = await api.post<ApiResponse<any>>('/products', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },
    update: async (id: string, data: Partial<Product>) => {
        const response = await api.put<ApiResponse<any>>(`/products/${id}`, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<{ message: string }>>(`/products/${id}`);
        return response.data;
    },
    updateOrder: async (products: { id: string; order_number: number }[]) => {
        const response = await api.post<ApiResponse<{ message: string }>>('/products/order', { products });
        return response.data;
    },
    uploadImages: async (productId: string, images: string[]) => {
        const response = await api.post<ApiResponse<{ images: string[] }>>('/products/upload-images', { productId, images });
        return response.data;
    }
};

// Visitor endpoints (token gerektirmez)
export const visitors: ApiService['visitors'] = {
    getCount: async () => {
        const response = await api.get<ApiResponse<{ count: number }>>('/visitors');
        return response.data;
    },
    increment: async () => {
        const response = await api.post<ApiResponse<{ count: number }>>('/visitors/increment');
        return response.data;
    }
};

// Upload service
export const upload = {
    uploadFile: async (file: File, fileName: string) => {
        try {
            // Dosya adını güvenli hale getir
            const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}-${safeFileName}`;

            const { data, error } = await supabase.storage
                .from('product-images') // Var olan bucket adı
                .upload(uniqueFileName, file, { // Path'i basitleştirdim
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Supabase yükleme hatası:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(uniqueFileName);

            return {
                data: {
                    path: data.path,
                    publicUrl
                },
                error: null
            };
        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            return { data: null, error };
        }
    },

    uploadMultipleFiles: async (files: File[]) => {
        try {
            const uploadPromises = files.map(async (file) => {
                const result = await upload.uploadFile(file, file.name);
                if (result.error) {
                    console.error('Dosya yükleme hatası:', result.error);
                    return undefined;
                }
                return result.data?.publicUrl;
            });

            const urls = await Promise.all(uploadPromises);
            return {
                data: {
                    urls: urls.filter(url => url !== undefined)
                },
                error: null
            };
        } catch (error) {
            console.error('Çoklu dosya yükleme hatası:', error);
            return { data: null, error };
        }
    }
};

export default api; 