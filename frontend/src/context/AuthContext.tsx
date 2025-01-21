import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import { supabase } from '../config/supabaseClient';

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

    // Session kontrolü
    const checkSession = async () => {
        try {
            // Önce localStorage'daki token'ı kontrol et
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                // Token varsa Supabase session'ını güncelle
                await supabase.auth.setSession({
                    access_token: storedToken,
                    refresh_token: ''
                });
            }

            // Supabase session'ını kontrol et
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.access_token) {
                // Session varsa admin kontrolü yap
                const { data: adminData } = await supabase
                    .from('admins')
                    .select('*')
                    .eq('user_id', session.user.id)
                .single();

                if (adminData) {
                    // Token'ı güncelle ve sakla
                    localStorage.setItem('token', session.access_token);

                    setAuthState({
                        user: session.user,
                        token: session.access_token,
                        isAuthenticated: true,
                    });
                    return;
                }
            }

            // Session veya admin yetkisi yoksa state'i temizle
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
            });
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Session kontrol hatası:', error);
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
            });
            localStorage.removeItem('token');
        }
    };

    // Component mount olduğunda session kontrolü yap
    useEffect(() => {
        checkSession();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data: { session }, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            if (!session) throw new Error('Oturum oluşturulamadı');

            // Admin kontrolü
            const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (adminError || !adminData) {
                throw new Error('Yönetici yetkisi bulunamadı');
            }

            // Token'ı sakla
            localStorage.setItem('token', session.access_token);

            setAuthState({
                user: session.user,
                token: session.access_token,
                isAuthenticated: true,
            });

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            localStorage.removeItem('token');
            setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
            });
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
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
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 