export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    categories?: {
        id: string;
        name: string;
    };
    images: string[];
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'user';
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    image?: string;
    created_at?: string;
    updated_at?: string;
} 