import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export interface SiteContent {
    key: string;
    value: string;
    section: string;
    label: string;
}

interface CMSContextType {
    content: { [key: string]: string };
    rawContent: SiteContent[];
    loading: boolean;
    getContent: (key: string, defaultValue?: string) => string;
    updateContent: (key: string, value: string) => Promise<void>;
    refreshContent: () => Promise<void>;
}

const CMSContext = createContext<CMSContextType>({
    content: {},
    rawContent: [],
    loading: true,
    getContent: () => '',
    updateContent: async () => { },
    refreshContent: async () => { },
});

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [content, setContent] = useState<{ [key: string]: string }>({});
    const [rawContent, setRawContent] = useState<SiteContent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchContent = async () => {
        try {
            const { data, error } = await supabase.from('site_content').select('*');
            if (error) throw error;

            const contentMap: { [key: string]: string } = {};
            if (data) {
                data.forEach((item: SiteContent) => {
                    contentMap[item.key] = item.value;
                });
                setRawContent(data);
                setContent(contentMap);
            }
        } catch (error) {
            console.error('Error fetching site content:', error);
        } finally {
            setLoading(false);
        }
    };

    // Safety timeout to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn('CMS loading timed out. Forcing content load.');
                setLoading(false);
            }
        }, 3000); // 3 seconds timeout
        return () => clearTimeout(timer);
    }, [loading]);


    useEffect(() => {
        fetchContent();
    }, []);

    const getContent = (key: string, defaultValue: string = '') => {
        return content[key] !== undefined ? content[key] : defaultValue;
    };

    const updateContent = async (key: string, newValue: string) => {
        try {
            // Optimistic update
            setContent(prev => ({ ...prev, [key]: newValue }));

            const { error } = await supabase
                .from('site_content')
                .update({ value: newValue })
                .eq('key', key);

            if (error) throw error;

            // Update raw list too
            setRawContent(prev => prev.map(item => item.key === key ? { ...item, value: newValue } : item));

        } catch (error) {
            console.error('Error updating content:', error);
            // Revert on error would go here ideally, or simple alert
            alert('Erro ao salvar conteúdo. Tente novamente.');
            fetchContent(); // Revert to server state
        }
    };

    return (
        <CMSContext.Provider value={{ content, rawContent, loading, getContent, updateContent, refreshContent: fetchContent }}>
            {children}
        </CMSContext.Provider>
    );
};

export const useCMS = () => useContext(CMSContext);
