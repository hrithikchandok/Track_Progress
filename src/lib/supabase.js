import { createClient } from '@supabase/supabase-js';
import { SYNC } from '../data/sync';

export const sb = createClient(SYNC.url, SYNC.anonKey);
