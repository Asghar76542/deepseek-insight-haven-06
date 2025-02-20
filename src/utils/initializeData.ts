
import { supabase } from "@/integrations/supabase/client";

export const initializeDefaultCategories = async () => {
  const defaultCategories = [
    { name: 'Literature Review', color: '#2563EB', description: 'Academic literature research' },
    { name: 'Data Analysis', color: '#059669', description: 'Data-focused research' },
    { name: 'Market Research', color: '#DC2626', description: 'Industry and market analysis' },
    { name: 'Technical Research', color: '#7C3AED', description: 'Technical documentation and specifications' },
    { name: 'General', color: '#4B5563', description: 'General research topics' },
  ];

  try {
    const { error } = await supabase
      .from('research_categories')
      .upsert(
        defaultCategories.map(category => ({
          ...category,
          id: crypto.randomUUID(),
        })),
        { onConflict: 'name' }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error initializing default categories:', error);
  }
};
