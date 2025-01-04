import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { AuthState, User } from '../types';

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
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: adminData } = await supabase
                    .from('admins')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                if (adminData) {
                    setAuthState({
                        user: {
                            id: session.user.id,
                            email: session.user.email!,
                            role: 'admin',
                        },
                        token: session.access_token,
                        isAuthenticated: true,
                    });
                }
            }
        };

        checkSession();
    }, []);

    const login = async (email: string, password: string) => {
        console.log('Login attempt:', email);
        const { data: { session }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('Login error:', error);
            throw error;
        }

        if (session) {
            console.log('Session obtained:', session.user.id);
            const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            console.log('Admin check result:', { adminData, adminError });

            if (adminError) {
                console.error('Admin check error:', adminError);
                throw new Error('Yönetici kontrolü sırasında hata oluştu');
            }

            if (!adminData) {
                console.log('User is not admin:', session.user.id);
                throw new Error('Yönetici yetkisi gerekli');
            }

            console.log('Admin login successful:', adminData);

            setAuthState({
                user: {
                    id: session.user.id,
                    email: session.user.email!,
                    role: 'admin',
                },
                token: session.access_token,
                isAuthenticated: true,
            });
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
        });
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