
import { supabase } from './supabaseClient';
import { Partner, PartnerCategory, PartnerDB } from '../types';

export const fetchPartners = async (): Promise<Partner[]> => {
    // Busca dados respeitando as policies RLS (associados só verão parceiros que têm vínculo com a associação deles).
    // Opcionalmente também trazemos se tiver custom_benefit
    const { data, error } = await supabase
        .from('partners')
        .select(`
            *,
            association_partners!inner(custom_benefit)
        `);

    if (error) {
        console.error('Error fetching partners:', error);
        return [];
    }

    // Map snake_case DB columns to camelCase TS interface
    // Includes overriding 'benefit' if a 'custom_benefit' exists in the association_partners pivot.
    // Ensure data is treated carefully as we joined table
    const partnersData = data as any[];

    return partnersData.map((p) => {
        // If there is an array of association_partners returned, we pick the first custom_benefit
        // Normally under RLS it will return just 1 matching association for the current user
        let finalBenefit = p.benefit || '';
        if (p.association_partners && Array.isArray(p.association_partners) && p.association_partners.length > 0) {
           const customBenefit = p.association_partners[0].custom_benefit;
           if(customBenefit) finalBenefit = customBenefit;
        }

        return {
        id: p.id,
        name: p.name,
        category: p.category as PartnerCategory,
        description: p.description,
        benefit: finalBenefit,
        fullRules: p.full_rules || '',
        logoUrl: p.logo_url || '',
        coverUrl: p.cover_url || '',
        city: p.city || '',
        address: p.address,
        isOnline: p.is_online,
        website: p.website,
        coordinates: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
        // Map new fields
        cnpj: p.cnpj,
        phone: p.phone,
        email: p.email,
        responsibleName: p.responsible_name,
        companyName: p.company_name,
        plan: p.plan as 'essencial' | 'destaque',
        price: p.price,
        actions: p.actions,
        active: p.active,
        status: p.status,
        priority: p.priority
        };
    });
};

export const fetchPartnerById = async (id: string): Promise<Partner | null> => {
    const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching partner:', error);
        return null;
    }

    const p = data;
    return {
        id: p.id,
        name: p.name,
        category: p.category as PartnerCategory,
        description: p.description,
        benefit: p.benefit,
        fullRules: p.full_rules,
        logoUrl: p.logo_url,
        coverUrl: p.cover_url,
        city: p.city,
        address: p.address,
        isOnline: p.is_online,
        website: p.website,
        coordinates: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
        // Map new fields
        cnpj: p.cnpj,
        phone: p.phone,
        email: p.email,
        responsibleName: p.responsible_name,
        companyName: p.company_name,
        plan: p.plan as 'essencial' | 'destaque',
        price: p.price,
        actions: p.actions,
        active: p.active,
        status: p.status,
        priority: p.priority
    };
};

export const createPartner = async (partnerData: Omit<PartnerDB, 'id'>): Promise<PartnerDB> => {
    const { data, error } = await supabase
        .from('partners')
        .insert([{
            ...partnerData,
            status: 'pending' // Default status for new partners
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating partner:', error);
        throw error;
    }

    return data;
};

export const updatePartner = async (id: string, updates: Partial<Partner>): Promise<Partner | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUpdates: any = {
        name: updates.name,
        category: updates.category,
        description: updates.description,
        benefit: updates.benefit,
        full_rules: updates.fullRules,
        logo_url: updates.logoUrl,
        cover_url: updates.coverUrl,
        city: updates.city,
        address: updates.address,
        is_online: updates.isOnline,
        website: updates.website,
        lat: updates.coordinates?.lat,
        lng: updates.coordinates?.lng,
        // New fields
        cnpj: updates.cnpj,
        phone: updates.phone,
        email: updates.email,
        responsible_name: updates.responsibleName,
        company_name: updates.companyName,
        plan: updates.plan,
        price: updates.price,
        actions: updates.actions,
        active: updates.active,
        status: updates.status,
        priority: updates.priority
    };

    // Remove undefined keys
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

    const { data, error } = await supabase
        .from('partners')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating partner:', error);
        return null;
    }

    const p = data;
    return {
        id: p.id,
        name: p.name,
        category: p.category as PartnerCategory,
        description: p.description,
        benefit: p.benefit,
        fullRules: p.full_rules,
        logoUrl: p.logo_url,
        coverUrl: p.cover_url,
        city: p.city,
        address: p.address,
        isOnline: p.is_online,
        website: p.website,
        coordinates: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined,
        // Map new fields
        cnpj: p.cnpj,
        phone: p.phone,
        email: p.email,
        responsibleName: p.responsible_name,
        companyName: p.company_name,
        plan: p.plan as 'essencial' | 'destaque',
        price: p.price,
        actions: p.actions,
        active: p.active,
        status: p.status,
        priority: p.priority
    };
};
