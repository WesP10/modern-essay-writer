import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// These will be environment variables
// For now, we'll use placeholders that you'll replace with actual values
const supabaseUrl = browser ? (import.meta.env.VITE_SUPABASE_URL || '') : '';
const supabaseAnonKey = browser ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '') : '';

// Check if Supabase is configured
export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
	!supabaseUrl.includes('your-project-url') && 
	!supabaseAnonKey.includes('your-anon-key');

export const supabase = isSupabaseConfigured 
	? createClient(supabaseUrl, supabaseAnonKey)
	: null as any; // Fallback for when Supabase is not configured

export type Database = {
	public: {
		Tables: {
			essays: {
				Row: {
					id: string;
					user_id: string;
					title: string;
					content: string;
					word_count: number | null;
					char_count: number | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					title: string;
					content: string;
					word_count?: number | null;
					char_count?: number | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					title?: string;
					content?: string;
					word_count?: number | null;
					char_count?: number | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			essay_versions: {
				Row: {
					id: string;
					essay_id: string;
					content: string;
					word_count: number | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					essay_id: string;
					content: string;
					word_count?: number | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					essay_id?: string;
					content?: string;
					word_count?: number | null;
					created_at?: string;
				};
			};
		};
	};
};
