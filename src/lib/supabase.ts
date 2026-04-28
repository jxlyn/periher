/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://idjxpkvukjkrvyueztnn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkanhwa3Z1a2prcnZ5dWV6dG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDIwODgsImV4cCI6MjA5Mjk3ODA4OH0.46P0rUTZXuVr37-aWwbZ2UYilxyJx9cyAfCBaZPfcz0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
