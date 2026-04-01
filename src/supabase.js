import { createClient } from '@supabase/supabase-js';

// Inga unga dashboard keys-a paste pannunga
const supabaseUrl = 'https://gmxmcztwhptvhhyqhbzk.supabase.co'; 
const supabaseKey = 'sb_publishable_3EwGvW3Kee9sHwnFyuPzvQ_rQxWiCR1'; 

export const supabase = createClient(supabaseUrl, supabaseKey);