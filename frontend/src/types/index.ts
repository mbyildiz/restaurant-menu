import { User as SupabaseUser } from '@supabase/supabase-js';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    images: string[];
    order_number: number;
    categories?: {
        id: string;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export type User = SupabaseUser;

export interface AuthState {
    user: SupabaseUser | null;
    token: string | null;
    isAuthenticated: boolean;
}

export interface Category {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    order_number: number;
    created_at: string;
    updated_at: string;
}

export interface CompanyInfo {
    id: string;
    company_name: string;
    company_address: string;
    phone_number: string;
    website?: string;
    social_media: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    logo_url?: string | null;
    qr_code?: string | null;
    maps?: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    details?: any;
    message?: string;
}

// API Service Types
export interface ApiService {
    auth: {
        login: (email: string, password: string) => Promise<ApiResponse<{ user: User; session: { access_token: string } }>>;
        logout: () => Promise<ApiResponse<void>>;
        getSession: () => Promise<ApiResponse<{ user: User; token: string } | { session: null }>>;
    };
    visitors: {
        getCount: () => Promise<ApiResponse<{ count: number }>>;
        increment: () => Promise<ApiResponse<{ count: number }>>;
    };
    company: {
        getInfo: () => Promise<ApiResponse<CompanyInfo>>;
        update: (data: Partial<CompanyInfo>) => Promise<ApiResponse<CompanyInfo>>;
    };
    categories: {
        getAll: () => Promise<ApiResponse<Category[]>>;
        getById: (id: string) => Promise<ApiResponse<Category>>;
        create: (data: FormData) => Promise<ApiResponse<Category>>;
        update: (id: string, data: FormData) => Promise<ApiResponse<Category>>;
        delete: (id: string) => Promise<ApiResponse<{ message: string }>>;
        updateOrder: (categories: { id: string; order_number: number }[]) => Promise<ApiResponse<{ message: string }>>;
    };
    products: {
        getAll: () => Promise<ApiResponse<Product[]>>;
        getById: (id: string) => Promise<ApiResponse<Product>>;
        getByCategory: (categoryId: string) => Promise<ApiResponse<Product[]>>;
        create: (data: Partial<Product>) => Promise<ApiResponse<Product>>;
        update: (id: string, data: Partial<Product>) => Promise<ApiResponse<Product>>;
        delete: (id: string) => Promise<ApiResponse<{ message: string }>>;
        updateOrder: (products: { id: string; order_number: number }[]) => Promise<ApiResponse<{ message: string }>>;
    };
    upload: {
        uploadFile: (file: File, fileName: string) => Promise<{ data: { path: string; publicUrl: string } | null; error: any }>;
        uploadMultipleFiles: (files: File[]) => Promise<{ data: { urls: string[] } | null; error: any }>;
    };
} 