import { Partner, User, UserRole, PartnerRegistrationData, PartnerCategory } from '../types';
import { PARTNERS, MOCK_USER } from '../constants';

const KEYS = {
    USERS: 'tavares_db_users',
    PARTNERS: 'tavares_db_partners',
    CURRENT_USER: 'tavares_auth_session',
};

// --- DATABASE SEEDING ---

const seedDatabase = () => {
    if (!localStorage.getItem(KEYS.USERS)) {
        console.log('🌱 Seeding Database...');

        // 1. Create Default Users (Client, Admin, Partner)
        const users: User[] = [
            {
                ...MOCK_USER,
                id: 'u_client_1',
                email: 'cliente@teste.com',
                role: UserRole.USER,
                name: 'Cliente Teste' // Password: '123'
            },
            {
                ...MOCK_USER,
                id: 'u_admin_1',
                email: 'admin@tavares.com',
                role: UserRole.ADMIN,
                name: 'Administrador' // Password: '123'
            },
            {
                ...MOCK_USER,
                id: 'u_partner_1',
                email: 'parceiro@teste.com',
                role: UserRole.PARTNER,
                name: 'Loja Exemplo', // Password: '123'
                partnerId: 'p_demo_1' // Links to partner record
            }
        ];

        // 2. Create Default Partner Record for the Partner User
        const demoPartner: Partner = {
            id: 'p_demo_1',
            name: 'Loja Exemplo',
            category: PartnerCategory.AUTOMOTIVE,
            description: 'Parceiro de demonstração do sistema.',
            benefit: '10% OFF',
            fullRules: 'Demonstração.',
            logoUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
            coverUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80',
            city: 'São Paulo',
            isOnline: false,
            address: 'Av. Paulista, 1000'
        };

        const initialPartners = [...PARTNERS, demoPartner];

        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(KEYS.PARTNERS, JSON.stringify(initialPartners));
    }
};

// Initialize DB
seedDatabase();

// --- AUTH SERVICES ---

export const getStoredUser = (): { user: User; isAuthenticated: boolean } => {
    const stored = localStorage.getItem(KEYS.CURRENT_USER);
    if (stored) {
        return { user: JSON.parse(stored), isAuthenticated: true };
    }
    return { user: MOCK_USER, isAuthenticated: false };
};

export const loginUser = (email: string, role: UserRole): User | null => {
    const usersStr = localStorage.getItem(KEYS.USERS);
    if (!usersStr) {
        // Fallback if seeded data missing (should run seedDatabase usually)
        seedDatabase();
        return null;
    }

    const users: User[] = JSON.parse(usersStr);

    // Simple Auth Logic
    const user = users.find(u => u.email === email); // In prod, check password too

    if (user) {
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
    }

    // Create temp user if not found (fallback for old flow)
    const tempUser: User = {
        ...MOCK_USER,
        email,
        role,
        name: role === UserRole.PARTNER ? 'Parceiro Novo' : 'Usuário'
    };
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(tempUser));
    return tempUser;
};

export const logoutUser = () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
};

// --- DATA SERVICES ---

export const getPartners = (): Partner[] => {
    const stored = localStorage.getItem(KEYS.PARTNERS);
    if (stored) {
        return JSON.parse(stored);
    }
    return PARTNERS;
};

export const registerPartner = (data: PartnerRegistrationData): boolean => {
    const currentPartners = getPartners();
    const usersStr = localStorage.getItem(KEYS.USERS);
    const currentUsers: User[] = usersStr ? JSON.parse(usersStr) : [];

    // 1. Create Partner Entity
    const newPartnerId = `p_${Date.now()}`;
    const newPartner: Partner = {
        id: newPartnerId,
        name: data.tradingName,
        category: data.category,
        description: data.description || `Parceiro ${data.category}`,
        benefit: 'A conferir',
        fullRules: 'Consulte condições.',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
        coverUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80',
        city: 'Nacional',
        address: 'Endereço cadastrado',
    };

    // 2. Create User Entity (Login)
    const newUser: User = {
        ...MOCK_USER,
        id: `u_${Date.now()}`,
        name: data.responsibleName,
        email: data.email,
        role: UserRole.PARTNER,
        partnerId: newPartnerId
    };

    // 3. Save Both (prepend so the new partner shows first)
    const updatedPartners = [newPartner, ...currentPartners];
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(updatedPartners));

    localStorage.setItem(KEYS.USERS, JSON.stringify([...currentUsers, newUser]));

    return true;
};

export const updatePartner = (updatedPartner: Partner): boolean => {
    const currentPartners = getPartners();
    const index = currentPartners.findIndex(p => p.id === updatedPartner.id);

    if (index !== -1) {
        currentPartners[index] = updatedPartner;
        localStorage.setItem(KEYS.PARTNERS, JSON.stringify(currentPartners));
        return true;
    }
    return false;
};
