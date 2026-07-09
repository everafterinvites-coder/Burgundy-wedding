import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

// Get stored Supabase credentials
export function getSupabaseCredentials() {
  const url = localStorage.getItem('wedding_supabase_url') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('wedding_supabase_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return !!(url && key);
}

// Get or initialize Supabase Client
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
      return supabaseClient;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

// Reset client when credentials change
export function resetSupabaseClient() {
  supabaseClient = null;
}

// Save credentials
export function saveSupabaseCredentials(url: string, key: string) {
  if (url) localStorage.setItem('wedding_supabase_url', url.trim());
  else localStorage.removeItem('wedding_supabase_url');

  if (key) localStorage.setItem('wedding_supabase_anon_key', key.trim());
  else localStorage.removeItem('wedding_supabase_anon_key');

  resetSupabaseClient();
}

// Clear credentials
export function clearSupabaseCredentials() {
  localStorage.removeItem('wedding_supabase_url');
  localStorage.removeItem('wedding_supabase_anon_key');
  resetSupabaseClient();
}

// Test Supabase connection with provided credentials
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false }
    });
    
    // Attempt a quick, non-destructive call (e.g., fetch first 1 row of rsvps)
    // If the table doesn't exist, it might fail, but it's a valid credentials test if it doesn't give auth error
    const { error } = await client.from('rsvps').select('id').limit(1);
    
    if (error) {
      // If error is code 42P01 (relation rsvps does not exist), the connection and auth are actually SUCCESSFUL!
      // It just means the tables need to be created.
      if (error.code === '42P01') {
        return { success: true };
      }
      return { success: false, error: `${error.message} (Code: ${error.code})` };
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// SQL schema snippet for Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- 1. Create RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id text PRIMARY KEY,
  "guestName" text NOT NULL,
  attending boolean NOT NULL DEFAULT true,
  dietary text,
  "guestsCount" integer DEFAULT 0,
  message text,
  "createdAt" text NOT NULL
);

-- Enable row-level security (RLS)
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow everyone to insert, allow everyone to select/read for wedding ease, or customize as needed)
CREATE POLICY "Allow public insert" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON rsvps FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON rsvps FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON rsvps FOR DELETE USING (true);

-- 2. Create Photos table
CREATE TABLE IF NOT EXISTS photos (
  id text PRIMARY KEY,
  "guestName" text NOT NULL,
  "photoUrl" text NOT NULL,
  caption text,
  "createdAt" text NOT NULL
);

-- Enable row-level security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies for Photos
CREATE POLICY "Allow public insert" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON photos FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON photos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON photos FOR DELETE USING (true);
`;

// Sync RSVPs from Firestore to Supabase (or vice-versa)
export async function syncRsvpToSupabase(rsvp: {
  id: string;
  guestName: string;
  attending: boolean;
  dietary: string;
  guestsCount: number;
  message: string;
  createdAt: string;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const { error } = await client
    .from('rsvps')
    .upsert({
      id: rsvp.id,
      guestName: rsvp.guestName,
      attending: rsvp.attending,
      dietary: rsvp.dietary || '',
      guestsCount: rsvp.guestsCount || 0,
      message: rsvp.message || '',
      createdAt: rsvp.createdAt
    });

  if (error) throw new Error(error.message);
}

// Delete RSVP from Supabase
export async function deleteRsvpFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from('rsvps')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting from Supabase:', error.message);
}

// Sync photo to Supabase
export async function syncPhotoToSupabase(photo: {
  id: string;
  guestName: string;
  photoUrl: string;
  caption: string;
  createdAt: string;
}) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const { error } = await client
    .from('photos')
    .upsert({
      id: photo.id,
      guestName: photo.guestName,
      photoUrl: photo.photoUrl,
      caption: photo.caption || '',
      createdAt: photo.createdAt
    });

  if (error) throw new Error(error.message);
}

// Delete Photo from Supabase
export async function deletePhotoFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from('photos')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting photo from Supabase:', error.message);
}

// Fetch all RSVPs from Supabase
export async function fetchSupabaseRsvps() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('rsvps')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Fetch all Photos from Supabase
export async function fetchSupabasePhotos() {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('photos')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
