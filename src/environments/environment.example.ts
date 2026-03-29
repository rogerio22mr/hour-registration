// Copy this file to environment.ts (development) and environment.prod.ts (production)
// and fill in your Supabase project credentials.
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  },
};
