// js/supabaseClient.js

// ⚠️ À personnaliser avec TES clés Supabase
const SUPABASE_URL = 'https://TON-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'TON_ANON_PUBLIC_KEY';

// Si tu utilises le CDN <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// la fonction createClient est disponible dans l'objet global `supabase`.[web:26]
const { createClient } = supabase;

// Client unique pour tout le dashboard
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
