
import { supabase } from './supabaseClient';
import { Partner, PartnerCategory, PartnerDB } from '../types';

export const fetchPartners = async (): Promise<Partner[]> => {
    const { data, error } = await supabase
        .from('partners')
        .select('*');

    if (error) {
        console.error('Error fetching partners:', error);
        return [];
    }

    // Map snake_case DB columns to camelCase TS interface if needed
    // Assuming DB columns are: logo_url, cover_url, full_rules, is_online
    const partnersData = data as unknown as PartnerDB[];

    return partnersData.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category as PartnerCategory,
        description: p.description,
        benefit: p.benefit || '',
        fullRules: p.full_rules || '',
        logoUrl: p.logo_url || '',
        coverUrl: p.cover_url || '',
        city: p.city || '',
        address: p.address,
        isOnline: p.is_online,
        website: p.website,
        coordinates: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined
    }));
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
        coordinates: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined
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
        lng: updates.coordinates?.lng
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
        coordinates: p.lat && p.lng ? { lat: p.lat, lng: p.lng } : undefined
    };
};
