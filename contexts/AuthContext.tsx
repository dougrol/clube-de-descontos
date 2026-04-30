/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: UserRole;
    memberStatus: string | null;
    associationId: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: UserRole.USER,
    memberStatus: null,
    associationId: null,
    loading: true,
    signOut: async () => { },
    refreshSession: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(UserRole.USER);
    const [memberStatus, setMemberStatus] = useState<string | null>(null);
    const [associationId, setAssociationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Guard against duplicate SIGNED_IN events (token refresh fires SIGNED_IN again)
    const lastProcessedToken = useRef<string | null>(null);

    useEffect(() => {
        // Check if URL contains recovery token - redirect to reset-password page
        const fullHash = window.location.hash;

        // Detect recovery tokens in various URL formats
        const hasRecoveryToken = fullHash.includes('type=recovery') ||
            fullHash.includes('type%3Drecovery') ||
            fullHash.includes('access_token=');

        const isOnResetPage = fullHash.includes('/reset-password');

        if (hasRecoveryToken && !isOnResetPage) {
            console.log('Recovery token detected, redirecting to reset-password');
            // Preserve the full hash with tokens - just prepend the route
            // The tokens are in the hash, we need to restructure it

            // Find where the tokens start
            const tokenStart = fullHash.indexOf('access_token=');
            if (tokenStart !== -1) {
                const tokens = fullHash.substring(tokenStart);
                window.location.hash = '/reset-password#' + tokens;
            } else {
                window.location.hash = '/reset-password';
            }
            return;
        }

        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                lastProcessedToken.current = session.access_token;
                fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for changes — deduplicate SIGNED_IN to prevent loop
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);

            // Handle password recovery - redirect to reset page
            if (event === 'PASSWORD_RECOVERY') {
                console.log('Password recovery detected, redirecting to reset page');
                window.location.hash = '/reset-password';
                setLoading(false);
                return;
            }

            // Deduplicate: skip if same access_token already processed
            if (event === 'SIGNED_IN' && session?.access_token === lastProcessedToken.current) {
                return;
            }

            if (event === 'SIGNED_IN' && session) {
                lastProcessedToken.current = session.access_token;
                setLoading(true);
            }

            if (event === 'SIGNED_OUT') {
                lastProcessedToken.current = null;
            }

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

    const fetchUserRole = async (userId: string, userEmail?: string) => {
        try {
            // 1. Check if user is Admin
            const { data: adminData } = await supabase
                .from('admin_users')
                .select('ativo')
                .eq('user_id', userId)
                .maybeSingle();

            if (adminData && adminData.ativo) {
                setRole(UserRole.ADMIN);
                console.log('DEBUG: Role set to ADMIN (from admin_users)');
                return;
            }

            // 2. Check if user is Partner
            const { data: partnerData } = await supabase
                .from('partners')
                .select('status')
                .eq('auth_user_id', userId)
                .maybeSingle();

            if (partnerData && partnerData.status !== 'inativo') {
                setRole(UserRole.PARTNER);
                console.log('DEBUG: Role set to PARTNER (from partners)');
                return;
            }

            // 3. Fallback to users table or set as USER (Associado)
            const { data: userData, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('fetchUserRole supabase error:', error);
            }

            if (userData && userData.role) {
                const dbRole = userData.role.toUpperCase();
                if (dbRole === 'ADMIN' || dbRole === 'TI') {
                    // Fallback se não achou na admin_users mas a role diz que é admin
                    setRole(UserRole.ADMIN);
                } else if (dbRole === 'PARTNER') {
                    setRole(UserRole.PARTNER);
                } else {
                    setRole(UserRole.USER);
                }
                console.log('DEBUG: Final Role Set from users table:', dbRole);
            } else {
                setRole(UserRole.USER);
                console.log('DEBUG: Defaulting to USER');
            }

            // Also map member status and association id if applicable
            const { data: memberData } = await supabase
                .from('members')
                .select('status, association_id')
                .eq('auth_user_id', userId)
                .maybeSingle();
            
            if (memberData) {
                setMemberStatus(memberData.status);
                setAssociationId(memberData.association_id);
            }

        } catch (error) {
            console.error('Error fetching role or member data:', error);
            setRole(UserRole.USER);
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

    const refreshSession = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
            await fetchUserRole(session.user.id);
        } else {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, memberStatus, associationId, loading, signOut, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
