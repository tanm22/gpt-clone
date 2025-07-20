import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/drizzle/schema';
import postgres from 'postgres';

export const createClient = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.error('Failed to set cookie:', error);
          }
        },
      },
    }
  );
  const queryClient = postgres(process.env.DATABASE_URL!);
  return { supabase, db: drizzle(queryClient, { schema }) };
};