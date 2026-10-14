import { ApiClient } from './api';
import { DemoApiClient } from './demoClient';
import { SupabaseApiClient } from './supabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let clientInstance: ApiClient;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') {
  clientInstance = new SupabaseApiClient(supabaseUrl, supabaseAnonKey);
} else {
  clientInstance = new DemoApiClient();
}

export const api = clientInstance;
export const isDemoMode = clientInstance.isDemo;
