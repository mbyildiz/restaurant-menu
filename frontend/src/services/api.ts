import axios, { AxiosError } from 'axios';
import { ApiService, ApiResponse } from '../types';

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

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Visitor endpoint'leri için token kontrolü yapma
        if (!config.url?.startsWith('/visitors')) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // FormData gönderimi için Content-Type header'ını kaldır
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError<ApiErrorResponse>) => {
        // Visitor endpoint'leri için 401 kontrolü yapma
        if (error.response?.status === 401 && !error.config?.url?.startsWith('/visitors')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        const errorMessage = error.response?.data?.error || error.message;
        console.error('API Error:', errorMessage);

        return Promise.reject({
            success: false,
            error: errorMessage,
            details: error.response?.data?.details
        });
    }
);

// Auth endpoints
export const auth: ApiService['auth'] = {
    login: async (email: string, password: string) => {
        const response = await api.post<ApiResponse<{ user: any; session: { access_token: string } }>>('/auth/login', { email, password });
        if (response.data.success && response.data.data.session?.access_token) {
            localStorage.setItem('token', response.data.data.session.access_token);
        }
        return response.data;
    },
    logout: async () => {
        try {
            const response = await api.post<ApiResponse<void>>('/auth/logout');
            localStorage.removeItem('token');
            return response.data;
        } catch (error) {
            localStorage.removeItem('token');
            throw error;
        }
    },
    getSession: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token bulunamadı');
        }
        const response = await api.get<ApiResponse<{ user: any; token: string } | { session: null }>>('/auth/session');
        return response.data;
    }
};

// Visitor endpoints
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

// Company endpoints
export const company: ApiService['company'] = {
    getInfo: async () => {
        const response = await api.get<ApiResponse<any>>('/company');
        return response.data;
    },
    update: async (data) => {
        const response = await api.put<ApiResponse<any>>('/company', data);
        return response.data;
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
        const response = await api.post<ApiResponse<any>>('/categories', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    update: async (id: string, formData: FormData) => {
        const response = await api.put<ApiResponse<any>>(`/categories/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
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

// Product endpoints
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
    create: async (data: FormData) => {
        const response = await api.post<ApiResponse<any>>('/products', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    update: async (id: string, data: FormData) => {
        const response = await api.put<ApiResponse<any>>(`/products/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<{ message: string }>>(`/products/${id}`);
        return response.data;
    },
    uploadImages: async (productId: string, images: File[]) => {
        const formData = new FormData();
        formData.append('productId', productId);
        images.forEach((image) => {
            formData.append('images', image);
        });
        const response = await api.post<ApiResponse<{ images: string[] }>>('/products/images', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    updateOrder: async (products: { id: string; order_number: number }[]) => {
        const response = await api.post<ApiResponse<{ message: string }>>('/products/order', { products });
        return response.data;
    }
};

// Upload endpoint
export const upload: ApiService['upload'] = {
    image: async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Token'ı localStorage'dan al
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Yetkilendirme token\'ı bulunamadı');
            }

            const response = await axios.post(`${API_URL}/upload/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Upload yanıtı:', response.data);
            return response.data;
        } catch (error) {
            console.error('Upload hatası:', error);
            throw error;
        }
    }
};

export default api; 