import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import { auth } from '../services/api';

interface AuthContextType {
    authState: AuthState;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
    });

    useEffect(() => {
        // Mevcut oturumu kontrol et
        const checkSession = async () => {
            const session = await auth.getSession();
            if (session.user) {
                setAuthState({
                    user: session.user,
                    token: session.token,
                    isAuthenticated: true,
                });
            }
        };

        checkSession();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const data = await auth.login(email, password);
            if (data.session?.access_token) {
                localStorage.setItem('token', data.session.access_token);
                setAuthState({
                    user: data.user,
                    token: data.session.access_token,
                    isAuthenticated: true,
                });
            } else {
                throw new Error('Oturum bilgisi alınamadı');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await auth.logout();
            localStorage.removeItem('token');
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
            });
        } catch (error) {
            console.error('Logout error:', error);
            // Hata olsa bile token'ı ve state'i temizle
            localStorage.removeItem('token');
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
            });
        }
    };

    // Sayfa yüklendiğinde token kontrolü
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Token varsa oturumu kontrol et
            checkSession();
        }
    }, []);

    // Mevcut oturumu kontrol et
    const checkSession = async () => {
        try {
            const session = await auth.getSession();
            if (session.user) {
                setAuthState({
                    user: session.user,
                    token: session.token,
                    isAuthenticated: true,
                });
            } else {
                // Geçersiz oturum, temizle
                localStorage.removeItem('token');
                setAuthState({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            }
        } catch (error) {
            console.error('Session check error:', error);
            // Hata durumunda temizle
            localStorage.removeItem('token');
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
            });
        }
    };

    return (
        <AuthContext.Provider value={{ authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 