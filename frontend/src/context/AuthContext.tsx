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

    const checkAdminStatus = async (userId: string) => {
        console.log('Checking admin status for user:', userId);
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Admin check error:', error);
            return false;
        }

        console.log('Admin data:', data);
        return !!data;
    };

    const updateAuthState = async (session: any) => {
        console.log('Updating auth state with session:', session);
        if (!session) {
            console.log('No session, clearing auth state');
            setAuthState({ user: null, token: null, isAuthenticated: false });
            return;
        }

        try {
            const isAdmin = await checkAdminStatus(session.user.id);
            console.log('Is admin?', isAdmin);

            if (!isAdmin) {
                console.log('Not an admin, signing out');
                await supabase.auth.signOut();
                setAuthState({ user: null, token: null, isAuthenticated: false });
                return;
            }

            console.log('Setting authenticated state');
            setAuthState({
                user: session.user,
                token: session.access_token,
                isAuthenticated: true,
            });
        } catch (error) {
            console.error('Error updating auth state:', error);
            setAuthState({ user: null, token: null, isAuthenticated: false });
        }
    };

    const login = async (email: string, password: string) => {
        console.log('Attempting login for:', email);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('Login response:', { data, error });

            if (error) {
                console.error('Login error:', error);
                throw error;
            }

            if (!data.session) {
                console.error('No session in login response');
                throw new Error('Oturum bilgisi alınamadı');
            }

            await updateAuthState(data.session);
        } catch (error: any) {
            console.error('Login process error:', error);
            await supabase.auth.signOut();
            setAuthState({ user: null, token: null, isAuthenticated: false });
            throw error;
        }
    };

    const logout = async () => {
        console.log('Logging out');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Logout error:', error);
        } finally {
            setAuthState({ user: null, token: null, isAuthenticated: false });
        }
    };

    useEffect(() => {
        console.log('Setting up auth subscriptions');

        const initializeAuth = async () => {
            console.log('Initializing auth');
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Session retrieval error:', error);
                return;
            }

            console.log('Initial session:', session);
            await updateAuthState(session);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', { event, session });
            await updateAuthState(session);
        });

        return () => {
            console.log('Cleaning up auth subscriptions');
            subscription.unsubscribe();
        };
    }, []);

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