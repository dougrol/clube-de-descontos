
import { supabase } from './supabaseClient';
import { Partner, PartnerCategory } from '../types';

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
    return data.map((p: any) => ({
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
