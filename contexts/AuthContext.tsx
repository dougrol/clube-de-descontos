import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: UserRole.USER,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(UserRole.USER);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setRole(UserRole.USER);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();
            if (error) {
                console.error('fetchUserRole supabase error:', error);
                setRole(UserRole.USER);
                return;
            }

            console.log('DEBUG: Role fetched from DB:', data); // LOG HERE

            if (data && (data as any).role) {
                const dbRole = (data as any).role;
                // Case-insensitive check
                if (dbRole.toUpperCase() === 'ADMIN') {
                    setRole(UserRole.ADMIN);
                } else if (dbRole.toUpperCase() === 'PARTNER') {
                    setRole(UserRole.PARTNER);
                } else {
                    setRole(UserRole.USER);
                }
                console.log('DEBUG: Final Role Set:', dbRole); // LOG HERE
            } else {
                setRole(UserRole.USER);
            }
        } catch (error) {
            console.error('Error fetching role:', error);
        } finally {
            setLoading(false);
        }
    };

    // Safety timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('Auth loading timed out. Forcing app load.');
                setLoading(false);
            }
        }, 3000); // 3 seconds timeout
        return () => clearTimeout(timer);
    }, [loading]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
